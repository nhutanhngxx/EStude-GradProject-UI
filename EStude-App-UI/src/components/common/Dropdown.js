import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  Dimensions,
  findNodeHandle,
  UIManager,
} from "react-native";

export default function Dropdown({ options, selected, onSelect }) {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 150 });
  const buttonRef = useRef(null);

  const openDropdown = () => {
    if (buttonRef.current) {
      UIManager.measure(
        findNodeHandle(buttonRef.current),
        (x, y, width, height, pageX, pageY) => {
          setPosition({ top: pageY + height, left: pageX, width });
          setVisible(true);
        }
      );
    }
  };

  return (
    <View ref={buttonRef}>
      {/* Nút mở dropdown */}
      <TouchableOpacity style={styles.dropdownButton} onPress={openDropdown}>
        <Text style={styles.dropdownText}>{selected || "Chọn"}</Text>
      </TouchableOpacity>

      {/* Modal hiển thị danh sách ngay dưới */}
      <Modal visible={visible} transparent animationType="none">
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setVisible(false)}
          activeOpacity={1}
        >
          <View
            style={[
              styles.dropdownContainer,
              {
                top: position.top,
                left: position.left,
                width: position.width,
              },
            ]}
          >
            <FlatList
              data={options}
              keyExtractor={(item, i) => i.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.option}
                  onPress={() => {
                    onSelect(item);
                    setVisible(false);
                  }}
                >
                  <Text style={styles.optionText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  dropdownButton: {
    borderWidth: 1,
    borderColor: "#ccc",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: "#fff",
  },
  dropdownText: {
    fontSize: 14,
    color: "#333",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "transparent",
  },
  dropdownContainer: {
    position: "absolute",
    backgroundColor: "#fff",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 4,
    maxHeight: 200,
  },
  option: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  optionText: {
    fontSize: 14,
    color: "#333",
  },
});
