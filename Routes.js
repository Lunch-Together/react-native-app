/**
 * Created by uran on 04/11/2018.
 */
import React from 'react'
import { Router, Scene } from 'react-native-router-flux'
import Login from './src/components/Login.js'
import Register from './src/components/Register'
import Home from './src/components/Home'
import Order from './src/components/Order'

const Routes = () => (
  <Router>
    <Scene key="root">
      <Scene key="login" component={Login} title="로그인" initial={true}/>
      <Scene key="register" component={Register} title="회원가입" />
      <Scene key="home" component={Home} title="런치투게더"/>
      <Scene key="order" component={Order} title="런치투게더"/>
    </Scene>
  </Router>
);
export default Routes
