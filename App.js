import React from 'react';
import { AppRegistry } from 'react-native';
import Routes from './src/components/Routes.js'

class App extends React.Component {
  render() {
    return (
      <Routes/>
    );
  }
}

export default App
AppRegistry.registerComponent('App', () => App);
