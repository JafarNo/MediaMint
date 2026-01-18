import { Ionicons } from '@expo/vector-icons';
import { useMemo, useRef, useState } from 'react';
import { Animated, Easing, PanResponder, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import '../global.css';

const getMonthMatrix = (year, month) => {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const matrix = [];
  let row = new Array(7).fill(null);
  let current = 1;
  for (let i = firstDay; i < 7; i++) row[i] = current++;
  matrix.push(row);
  while (current <= daysInMonth) {
    row = new Array(7).fill(null);
    for (let i = 0; i < 7 && current <= daysInMonth; i++) row[i] = current++;
    matrix.push(row);
  }
  return matrix;
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const Calendar = ({ onSelect = () => {}, onMonthChange = () => {}, initialDate = new Date(), scheduledItems = [] }) => {
  const [cursor, setCursor] = useState(new Date(initialDate.getFullYear(), initialDate.getMonth(), 1));
  const [selected, setSelected] = useState(initialDate);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const matrix = useMemo(() => getMonthMatrix(cursor.getFullYear(), cursor.getMonth()), [cursor]);

  const today = new Date();
  const monthName = cursor.toLocaleString(undefined, { month: 'long' });
  const year = cursor.getFullYear();

  const animateSlide = (direction) => {
    slideAnim.setValue(direction === 'left' ? 300 : -300);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 250,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  const goToPrevMonth = () => {
    animateSlide('right');
    setCursor(prev => {
      const newDate = new Date(prev.getFullYear(), prev.getMonth() - 1, 1);
      onMonthChange(newDate);
      return newDate;
    });
  };

  const goToNextMonth = () => {
    animateSlide('left');
    setCursor(prev => {
      const newDate = new Date(prev.getFullYear(), prev.getMonth() + 1, 1);
      onMonthChange(newDate);
      return newDate;
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 20,
      onPanResponderRelease: (_, g) => {
        if (g.dx < -50) goToNextMonth();
        else if (g.dx > 50) goToPrevMonth();
      },
    })
  ).current;

  const getScheduledCount = (day) => {
    if (!day) return 0;
    
    // Build the target date string in YYYY-MM-DD format for comparison
    const targetDateStr = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    return scheduledItems.filter(item => {
      // item.date should be in YYYY-MM-DD format
      if (typeof item.date === 'string') {
        return item.date === targetDateStr;
      }
      // Fallback for Date objects
      const itemDate = new Date(item.date);
      return itemDate.getFullYear() === cursor.getFullYear() &&
             itemDate.getMonth() === cursor.getMonth() &&
             itemDate.getDate() === day;
    }).length;
  };

  const goToToday = () => {
    const now = new Date();
    setCursor(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelected(now);
    onSelect(now);
  };

  return (
    <View style={styles.container}>
      {/* Header with month navigation */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goToPrevMonth} style={styles.navButton} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={20} color="#0B3D2E" />
        </TouchableOpacity>
        
        <TouchableOpacity onPress={goToToday} activeOpacity={0.7} style={styles.monthYearContainer}>
          <Text style={styles.monthText}>{monthName}</Text>
          <Text style={styles.yearText}>{year}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={goToNextMonth} style={styles.navButton} activeOpacity={0.7}>
          <Ionicons name="chevron-forward" size={20} color="#0B3D2E" />
        </TouchableOpacity>
      </View>

      {/* Calendar Card */}
      <View style={styles.calendarCard}>
        {/* Week Days Header */}
        <View style={styles.weekHeader}>
          {DAYS.map((day, index) => (
            <View key={index} style={styles.weekDayCell}>
              <Text style={[
                styles.weekDayText,
                (index === 0 || index === 6) && styles.weekendText
              ]}>
                {day}
              </Text>
            </View>
          ))}
        </View>

        {/* Days Grid */}
        <Animated.View
          {...panResponder.panHandlers}
          style={[styles.daysContainer, { transform: [{ translateX: slideAnim }] }]}
        >
          {matrix.map((week, weekIndex) => (
            <View key={weekIndex} style={styles.weekRow}>
              {week.map((day, dayIndex) => {
                const isToday =
                  day &&
                  cursor.getFullYear() === today.getFullYear() &&
                  cursor.getMonth() === today.getMonth() &&
                  day === today.getDate();

                const isSelected =
                  day &&
                  selected.getFullYear() === cursor.getFullYear() &&
                  selected.getMonth() === cursor.getMonth() &&
                  selected.getDate() === day;

                const scheduledCount = getScheduledCount(day);
                const hasScheduled = scheduledCount > 0;
                const isWeekend = dayIndex === 0 || dayIndex === 6;

                return (
                  <TouchableOpacity
                    key={dayIndex}
                    style={styles.dayCell}
                    onPress={() => {
                      if (day) {
                        const d = new Date(cursor.getFullYear(), cursor.getMonth(), day);
                        setSelected(d);
                        onSelect(d);
                      }
                    }}
                    activeOpacity={day ? 0.6 : 1}
                  >
                    {day && (
                      <View style={styles.dayContent}>
                        <View style={[
                          styles.dayCircle,
                          isSelected && styles.selectedDay,
                          isToday && !isSelected && styles.todayDay,
                        ]}>
                          <Text style={[
                            styles.dayText,
                            isSelected && styles.selectedDayText,
                            isToday && !isSelected && styles.todayDayText,
                            isWeekend && !isSelected && !isToday && styles.weekendDayText,
                          ]}>
                            {day}
                          </Text>
                        </View>
                        
                        {/* Scheduled indicator dots */}
                        {hasScheduled && (
                          <View style={styles.dotsContainer}>
                            {scheduledCount >= 1 && <View style={[styles.dot, styles.dotGreen]} />}
                            {scheduledCount >= 2 && <View style={[styles.dot, styles.dotBlue]} />}
                            {scheduledCount >= 3 && <View style={[styles.dot, styles.dotOrange]} />}
                          </View>
                        )}
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </Animated.View>

        {/* Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.dotGreen]} />
            <Text style={styles.legendText}>Posts</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.dotBlue]} />
            <Text style={styles.legendText}>Stories</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.dotOrange]} />
            <Text style={styles.legendText}>Emails</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#E6F4F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthYearContainer: {
    alignItems: 'center',
  },
  monthText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  yearText: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  calendarCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  weekHeader: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  weekDayCell: {
    flex: 1,
    alignItems: 'center',
  },
  weekDayText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  weekendText: {
    color: '#9CA3AF',
  },
  daysContainer: {
    paddingVertical: 4,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  dayContent: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedDay: {
    backgroundColor: '#0B3D2E',
  },
  todayDay: {
    backgroundColor: '#E6F4F1',
    borderWidth: 2,
    borderColor: '#0B3D2E',
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  selectedDayText: {
    color: 'white',
    fontWeight: '600',
  },
  todayDayText: {
    color: '#0B3D2E',
    fontWeight: '700',
  },
  weekendDayText: {
    color: '#9CA3AF',
  },
  dotsContainer: {
    flexDirection: 'row',
    marginTop: 2,
    gap: 3,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  dotGreen: {
    backgroundColor: '#10B981',
  },
  dotBlue: {
    backgroundColor: '#3B82F6',
  },
  dotOrange: {
    backgroundColor: '#F59E0B',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingTop: 16,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#6B7280',
  },
});

export default Calendar;
