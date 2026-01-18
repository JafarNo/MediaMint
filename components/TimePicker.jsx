import React, { useState } from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import WheelPicker from 'react-native-wheel-picker-expo';
import '../global.css';

const hours = Array.from({ length: 12 }, (_, i) => i + 1); 
const minutes = Array.from({ length: 60 }, (_, i) => i); 
const ampm = ['AM', 'PM'];

const CustomSpinnerTimePicker = ({ onChange, initialTime, selectedDate }) => {
  const now = new Date();
  const startTime = initialTime || now;

  const [time, setTime] = useState(startTime);
  const [visible, setVisible] = useState(false);

  const [tempHour, setTempHour] = useState(startTime.getHours() % 12 || 12);
  const [tempMinute, setTempMinute] = useState(startTime.getMinutes());
  const [tempAMPM, setTempAMPM] = useState(startTime.getHours() >= 12 ? 1 : 0);

  const openModal = () => setVisible(true);
  const closeModal = () => setVisible(false);

  // Check if selected date is today
  const isToday = () => {
    if (!selectedDate) return true;
    const today = new Date();
    return selectedDate.getFullYear() === today.getFullYear() &&
           selectedDate.getMonth() === today.getMonth() &&
           selectedDate.getDate() === today.getDate();
  };

  // Validate time to ensure it's not in the past (only if today)
  const validateTime = (newDate) => {
    if (!isToday()) return newDate;
    
    const currentTime = new Date();
    if (newDate.getHours() < currentTime.getHours() ||
        (newDate.getHours() === currentTime.getHours() && newDate.getMinutes() < currentTime.getMinutes())) {
      // If time is in the past, set to current time
      const validTime = new Date(newDate);
      validTime.setHours(currentTime.getHours());
      validTime.setMinutes(currentTime.getMinutes());
      return validTime;
    }
    return newDate;
  };

  const applySelection = () => {
    const newDate = new Date(time);

    let hourValue = tempHour % 12;
    if (tempAMPM === 1) hourValue += 12; 
    if (tempAMPM === 0 && tempHour === 12) hourValue = 0; 

    newDate.setHours(hourValue);
    newDate.setMinutes(tempMinute);

    const validTime = validateTime(newDate);
    setTime(validTime);
    onChange && onChange(validTime);

    closeModal();
  };

  return (
    <View>
      <TouchableOpacity onPress={openModal}>
        <Text className="text-gray-700 text-sm border border-gray-300 px-3 py-2 rounded-lg bg-gray-100">
          {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="slide">
        <View className="flex-1 bg-black/40 justify-end">
          <View className="bg-white p-4 rounded-t-2xl">

            <Text className="text-center font-inter text-lg mb-3">
              Select Time
            </Text>

            <View className="flex-row justify-between">

            
              <WheelPicker
                items={hours.map(h => ({ label: String(h) }))}
                selectedIndex={hours.indexOf(tempHour)}
                onChange={({ index }) => setTempHour(hours[index])}
                height={180}
                width={80}
              />

            
              <WheelPicker
                items={minutes.map(m => ({
                  label: m.toString().padStart(2, '0'),
                }))}
                selectedIndex={tempMinute}
                onChange={({ index }) => setTempMinute(index)}
                height={180}
                width={80}
              />

           
              <WheelPicker
                items={ampm.map(x => ({ label: x }))}
                selectedIndex={tempAMPM}
                onChange={({ index }) => setTempAMPM(index)}
                height={180}
                width={80}
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

export default CustomSpinnerTimePicker;
