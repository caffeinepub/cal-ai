import Map "mo:core/Map";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Time "mo:core/Time";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import List "mo:core/List";
import Order "mo:core/Order";
import Int "mo:core/Int";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import MixinAuthorization "authorization/MixinAuthorization";
import OutCall "http-outcalls/outcall";
import AccessControl "authorization/access-control";

actor {
  type UserRole = AccessControl.UserRole;

  module DailyCalorieGoal {
    public type T = Nat;
    public func compare(d1 : T, d2 : T) : Order.Order {
      Nat.compare(d1, d2);
    };
  };

  public type Profile = {
    firstName : Text;
    lastName : Text;
    birthday : Text;
    weight : Float;
    goal : Goal;
    gender : Text;
    exerciseFrequency : ExerciseFrequency;
    ingredientAvoidances : [Text];
    dailyCalorieTarget : Nat;
  };

  public type Goal = {
    #lose;
    #maintain;
    #gain;
    #other;
  };

  public type ExerciseFrequency = {
    #none;
    #once;
    #twice;
    #three;
    #fourPlus;
  };

  public type MacroNutrients = {
    sugar : Float;
    salt : Float;
    cholesterol : Float;
    protein : Float;
    fat : Float;
    carbs : Float;
  };

  public type RecommendationTag = {
    #recommended;
    #okay;
    #notRecommended;
  };

  public type FoodLogEntry = {
    foodName : Text;
    calories : Nat;
    servingSize : Text;
    macros : MacroNutrients;
    loggedTimestamp : Int;
    recommendationTag : RecommendationTag;
  };

  let profiles = Map.empty<Principal, Profile>();
  let foodLogs = Map.empty<Principal, List.List<FoodLogEntry>>();
  let dailyCalorieGoals = Map.empty<Principal, Nat>();

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  // Frontend-required profile functions
  public query ({ caller }) func getCallerUserProfile() : async ?Profile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    profiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?Profile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    profiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : Profile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    profiles.add(caller, profile);
  };

  // Legacy profile functions (keeping for backward compatibility)
  public query ({ caller }) func getProfile() : async Profile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    switch (profiles.get(caller)) {
      case (null) { Runtime.trap("Profile does not exist") };
      case (?profile) { profile };
    };
  };

  public shared ({ caller }) func saveProfile(profile : Profile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    profiles.add(caller, profile);
  };

  public shared ({ caller }) func addFoodLogEntry(entry : FoodLogEntry) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add food logs");
    };

    let currentLogs = switch (foodLogs.get(caller)) {
      case (null) { List.empty<FoodLogEntry>() };
      case (?logs) { logs };
    };
    currentLogs.add(entry);
    foodLogs.add(caller, currentLogs);
  };

  public shared ({ caller }) func deleteFoodLogEntry(timestamp : Int) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete food logs");
    };

    switch (foodLogs.get(caller)) {
      case (null) { Runtime.trap("No food logs found for user") };
      case (?logs) {
        let filteredLogs = logs.filter(func(entry) { entry.loggedTimestamp != timestamp });
        foodLogs.add(caller, filteredLogs);
      };
    };
  };

  public shared ({ caller }) func updateDailyCalorieTarget(newTarget : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update calorie targets");
    };
    dailyCalorieGoals.add(caller, newTarget);
  };

  module FoodLogEntry {
    public func compareByTimestamp(a : FoodLogEntry, b : FoodLogEntry) : Order.Order {
      Int.compare(a.loggedTimestamp, b.loggedTimestamp);
    };
  };

  public query ({ caller }) func getFoodLogsByDateRange(startDate : Int, endDate : Int) : async [FoodLogEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access food logs");
    };

    switch (foodLogs.get(caller)) {
      case (null) { [] };
      case (?logs) {
        logs.toArray().filter(
          func(entry) {
            entry.loggedTimestamp >= startDate and entry.loggedTimestamp <= endDate
          }
        ).sort(FoodLogEntry.compareByTimestamp);
      };
    };
  };

  public query ({ caller }) func getTotalCaloriesToday() : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access calorie totals");
    };

    let currentTime = Time.now();
    let dayStart = currentTime - (currentTime % 86_400_000_000_000);

    switch (foodLogs.get(caller)) {
      case (null) { 0 };
      case (?logs) {
        var total = 0;
        for (entry in logs.values()) {
          if (entry.loggedTimestamp >= dayStart) {
            total += entry.calories;
          };
        };
        total;
      };
    };
  };

  public query ({ caller }) func getWeeklyCalorieHistory() : async [Nat] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access weekly history");
    };

    let currentTime = Time.now();
    let days = Array.repeat(0, 7);

    switch (foodLogs.get(caller)) {
      case (null) { days };
      case (?logs) {
        let sortedLogs = logs.toArray();

        for (i in Nat.range(0, 7)) {
          let dayStart = currentTime - (i * 86_400_000_000_000 + (currentTime % 86_400_000_000_000));
          let dayEnd = dayStart + 86_400_000_000_000;

          let dailyTotal = sortedLogs.filter(
            func(entry) {
              entry.loggedTimestamp >= dayStart and entry.loggedTimestamp < dayEnd
            }
          ).foldLeft(
            0,
            func(acc, entry) {
              acc + entry.calories;
            },
          );
        };
        days;
      };
    };
  };

  public shared ({ caller }) func analyzeFood(foodDescription : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can analyze food");
    };
    let baseUrl = "https://world.openfoodfacts.org/cgi/search.pl?search_terms=";
    let url = baseUrl # foodDescription # "&search_simple=1";
    await OutCall.httpGetRequest(url, [], transform);
  };
};
