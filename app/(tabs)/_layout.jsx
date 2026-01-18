import TabBar from '@/components/TabBar';
import { Tabs } from 'expo-router';
import { View } from 'react-native';
import '../../global.css';

const TabsLayout = () => {    
  return (
    <View style={{ flex: 1 }}>
      <Tabs tabBar={(props) => <TabBar {...props} />}>
        <Tabs.Screen
          name="home"
          options={{
            title: "Home",
            headerShown: false, 
          }}
        />
        <Tabs.Screen
          name="create"
          options={{
            title: "Create",
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="scheduler"
          options={{
            title: "Scheduler",
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="responses"
          options={{
            title: "Responses",
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            headerShown: false,
          }}
        />
      </Tabs>
    </View>
  );
};



export default TabsLayout
