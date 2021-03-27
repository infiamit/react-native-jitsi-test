/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 */

import React, {useState} from 'react';
import {StyleSheet, View, Button, TextInput} from 'react-native';
import JitsiRTC from './src/features/lib-jitsi-meet/JitsiRTC';

const App: () => React$Node = () => {
  return (
    <View>
      <JitsiRTC />
    </View>
  );
};

export default App;
