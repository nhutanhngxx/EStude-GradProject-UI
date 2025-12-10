/**
 * Grade Level Constants
 * API v2.0 - Must use exact enum values
 */

export const GRADE_LEVELS = [
  { value: "GRADE_6", label: "Lớp 6" },
  { value: "GRADE_7", label: "Lớp 7" },
  { value: "GRADE_8", label: "Lớp 8" },
  { value: "GRADE_9", label: "Lớp 9" },
  { value: "GRADE_10", label: "Lớp 10" },
  { value: "GRADE_11", label: "Lớp 11" },
  { value: "GRADE_12", label: "Lớp 12" },
];

/**
 * Convert grade number to enum string
 * @param {number} gradeNum - Grade number (6-12)
 * @returns {string} Grade level enum (e.g., "GRADE_10")
 */
export const gradeNumToEnum = (gradeNum) => {
  return `GRADE_${gradeNum}`;
};

/**
 * Convert enum string to grade number
 * @param {string} gradeEnum - Grade level enum (e.g., "GRADE_10")
 * @returns {number} Grade number (10)
 */
export const gradeEnumToNum = (gradeEnum) => {
  return parseInt(gradeEnum.replace("GRADE_", ""));
};

/**
 * Get grade label from enum
 * @param {string} gradeEnum - Grade level enum
 * @returns {string} Grade label (e.g., "Lớp 10")
 */
export const getGradeLabel = (gradeEnum) => {
  const grade = GRADE_LEVELS.find((g) => g.value === gradeEnum);
  return grade ? grade.label : gradeEnum;
};
