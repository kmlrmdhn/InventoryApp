import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {Text, View, StyleSheet, StatusBar} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider, useSafeAreaInsets} from 'react-native-safe-area-context';
import {ProductProvider} from './src/context/ProductContext';
import DashboardScreen from './src/screens/DashboardScreen';
import ProductsScreen from './src/screens/ProductsScreen';
import AddProductScreen from './src/screens/AddProductScreen';
import ReportsScreen from './src/screens/ReportsScreen';

const Tab = createBottomTabNavigator();

const COLORS = {
  primary: '#6C63FF',
  bg: '#0F0F1A',
  tabBg: '#12121F',
  textMuted: '#7A7A9D',
};

function TabIcon({name, focused}: {name: string; focused: boolean}) {
  const icons: Record<string, string> = {
    Dashboard: '🏠',
    Produk: '📦',
    Tambah: '➕',
    Laporan: '📊',
  };
  return (
    <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
      <Text style={[styles.tabEmoji, focused && styles.tabEmojiActive]}>
        {icons[name]}
      </Text>
    </View>
  );
}

function MainTabs() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: COLORS.tabBg,
          borderTopColor: '#2A2A40',
          borderTopWidth: 1,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 4,
        },
      }}>
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({focused}) => (
            <TabIcon name="Dashboard" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Produk"
        component={ProductsScreen}
        options={{
          tabBarIcon: ({focused}) => (
            <TabIcon name="Produk" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Tambah"
        component={AddProductScreen}
        options={{
          tabBarIcon: ({focused}) => (
            <TabIcon name="Tambah" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Laporan"
        component={ReportsScreen}
        options={{
          tabBarIcon: ({focused}) => (
            <TabIcon name="Laporan" focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function App(): React.JSX.Element {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar
          barStyle="light-content"
          backgroundColor="transparent"
          translucent
        />
        <ProductProvider>
          <NavigationContainer>
            <MainTabs />
          </NavigationContainer>
        </ProductProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: COLORS.bg},
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainerActive: {
    backgroundColor: COLORS.primary + '25',
    borderWidth: 1,
    borderColor: COLORS.primary + '66',
  },
  tabEmoji: {fontSize: 22, opacity: 0.6},
  tabEmojiActive: {fontSize: 24, opacity: 1},
});

export default App;
