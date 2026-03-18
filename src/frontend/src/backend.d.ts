import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface MacroNutrients {
    fat: number;
    carbs: number;
    salt: number;
    sugar: number;
    protein: number;
    cholesterol: number;
}
export interface FoodLogEntry {
    loggedTimestamp: bigint;
    recommendationTag: RecommendationTag;
    calories: bigint;
    servingSize: string;
    macros: MacroNutrients;
    foodName: string;
}
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export interface Profile {
    weight: number;
    goal: Goal;
    exerciseFrequency: ExerciseFrequency;
    birthday: string;
    gender: string;
    ingredientAvoidances: Array<string>;
    dailyCalorieTarget: bigint;
    lastName: string;
    firstName: string;
}
export interface http_header {
    value: string;
    name: string;
}
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export enum ExerciseFrequency {
    three = "three",
    twice = "twice",
    none = "none",
    once = "once",
    fourPlus = "fourPlus"
}
export enum Goal {
    other = "other",
    gain = "gain",
    lose = "lose",
    maintain = "maintain"
}
export enum RecommendationTag {
    okay = "okay",
    recommended = "recommended",
    notRecommended = "notRecommended"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addFoodLogEntry(entry: FoodLogEntry): Promise<void>;
    analyzeFood(foodDescription: string): Promise<string>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    deleteFoodLogEntry(timestamp: bigint): Promise<void>;
    getCallerUserProfile(): Promise<Profile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getFoodLogsByDateRange(startDate: bigint, endDate: bigint): Promise<Array<FoodLogEntry>>;
    getProfile(): Promise<Profile>;
    getTotalCaloriesToday(): Promise<bigint>;
    getUserProfile(user: Principal): Promise<Profile | null>;
    getWeeklyCalorieHistory(): Promise<Array<bigint>>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: Profile): Promise<void>;
    saveProfile(profile: Profile): Promise<void>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    updateDailyCalorieTarget(newTarget: bigint): Promise<void>;
}
