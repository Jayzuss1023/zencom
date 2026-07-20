"use client";

export const VISITOR_ID_KEY = "mychat_visitor_id";
export const VISITOR_NAME_KEY = "mychat_visitor_name";

// Getting/Mutating visitor id | name
// Will live in local storage in window refresh
export function loadOrCreate(key: string) {
  const anonymous = "v_" + Math.random().toString(36).slice(2);
  const v = localStorage.getItem(key);
  if (!v) {
    localStorage.setItem(key, anonymous);
  }
  console.log(v);
  return v;
}
