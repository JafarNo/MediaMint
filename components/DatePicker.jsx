import React, { useRef, useState } from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import WheelPicker from 'react-native-wheel-picker-expo';
import '../global.css';

const months = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const CustomSpinnerDatePicker = ({ onChange, initialDate }) => {
  const now = new Date();
  const startDate = initialDate || now;
  const [date, setDate] = useState(startDate);
  const [visible, setVisible] = useState(false);
  const [pickerKey, setPickerKey] = useState(0);
  
  // Use refs to store the latest selected values
  const selectedMonthRef = useRef(startDate.getMonth());
  const selectedDayRef = useRef(startDate.getDate() - 1);
  const selectedYearIndexRef = useRef(0);

  const currentYear = now.getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear + i);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  const openModal = () => {
    // Reset refs to current date values
    selectedMonthRef.current = date.getMonth();
    selectedDayRef.current = date.getDate() - 1;
    selectedYearIndexRef.current = years.indexOf(date.getFullYear()) >= 0 ? years.indexOf(date.getFullYear()) : 0;
    setPickerKey(prev => prev + 1); // Force re-render of pickers
    setVisible(true);
  };
  const closeModal = () => setVisible(false);

  const applySelection = () => {
    const newDate = new Date(years[selectedYearIndexRef.current], selectedMonthRef.current, selectedDayRef.current + 1);
    setDate(newDate);
    onChange && onChange(newDate);
    closeModal();
  };

  return (
    <View>
      <TouchableOpacity onPress={openModal}>
        <Text className="text-gray-700 text-sm border border-gray-300 px-3 py-2 rounded-lg bg-gray-100">
          {date.toDateString()}
        </Text>
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="slide">
        <View className="flex-1 bg-black/40 justify-end">
          <View className="bg-white p-4 rounded-t-2xl">

            <Text className="text-center font-inter text-lg mb-3">
              Select Date
            </Text>

            <View className="flex-row justify-between">

              <WheelPicker
                key={`month-${pickerKey}`}
                items={months.map(m => ({ label: m }))}
                initialSelectedIndex={selectedMonthRef.current}
                onChange={({ index }) => { selectedMonthRef.current = index; }}
                height={180}
                width={100}
              />

              <WheelPicker
                key={`day-${pickerKey}`}
                items={days.map(d => ({ label: String(d) }))}
                initialSelectedIndex={selectedDayRef.current}
                onChange={({ index }) => { selectedDayRef.current = index; }}
                height={180}
                width={80}
              />

              <WheelPicker
                key={`year-${pickerKey}`}
                items={years.map(y => ({ label: String(y) }))}
                initialSelectedIndex={selectedYearIndexRef.current}
                onChange={({ index }) => { selectedYearIndexRef.current = index; }}
                height={180}
                width={100}
              />

            </View>

            <TouchableOpacity
              onPress={applySelection}
              className="bg-LogoGreen p-3 rounded-full mt-4"
            >
              <Text className="text-white text-center font-inter">
                Select
              </Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>
    </View>
  );
};

export default CustomSpinnerDatePicker;
