const Toolbar = ({ filterStatus, setFilterStatus, keyword, setKeyword }) => (
  <div className="flex flex-wrap gap-4 items-center">
    <div className="flex items-center gap-2">
      <input
        type="text"
        placeholder="Tìm kiếm lớp/môn..."
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        className="px-3 py-2 border rounded-lg flex-1"
      />
      <select
        value={filterStatus}
        onChange={(e) => setFilterStatus(e.target.value)}
        className="px-3 py-2 border rounded-lg"
      >
        <option value="current">Đang diễn ra</option>
        <option value="upcoming">Sắp diễn ra</option>
        <option value="ended">Đã xong</option>
        <option value="all">Tất cả</option>
      </select>
    </div>
  </div>
);

export default Toolbar;
