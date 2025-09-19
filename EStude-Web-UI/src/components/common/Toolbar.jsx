import { useTranslation } from "react-i18next";

const Toolbar = ({
  filterStatus,
  setFilterStatus,
  keyword,
  setKeyword,
  selectedSchool,
  setSelectedSchool,
  schools = [],
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap gap-4 items-center">
      {/* Tìm kiếm & Trạng thái */}
      <div className="flex flex-wrap gap-2 items-center">
        <input
          type="text"
          placeholder={t("manageClasses.searchPlaceholder")}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="current">{t("manageClasses.filters.current")}</option>
          <option value="upcoming">
            {t("manageClasses.filters.upcoming")}
          </option>
          <option value="ended">{t("manageClasses.filters.ended")}</option>
          <option value="all">{t("manageClasses.filters.all")}</option>
        </select>

        {/* Chọn trường */}
        {schools.length > 0 && (
          <select
            value={selectedSchool}
            onChange={(e) => setSelectedSchool(e.target.value)}
            className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">{t("manageClasses.filters.allSchools")}</option>
            {schools.map((s) => (
              <option key={s.schoolId} value={s.schoolId}>
                {s.schoolName}
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
};

export default Toolbar;
