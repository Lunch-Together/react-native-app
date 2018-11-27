/**
 * Created by uran on 08/11/2018.
 *
 * 테이블에 추가된 유저가 메뉴를 주문하고 데이터를 보는 화면
 */
import React from 'react'
import { Dimensions, FlatList, StyleSheet, View } from 'react-native'
import { TabBar, TabView } from 'react-native-tab-view';
import UserProfileListItem from "../../components/order/profile/UserProfileListItem";
import * as meApi from "../../api/me"
import * as groupApi from "../../api/groups"
import * as shopApi from "../../api/shop"
import SocketIOClient from 'socket.io-client'
import { getAccessToken, URL } from '../../api/constants'
import MenuList from "./MenuList";

export default class Order extends React.Component {

  state = {
    index: 0,
    routes: [
      { key: 'first', title: '분식' },
      { key: 'second', title: '식사' },
      { key: 'third', title: '주류' }
    ],
    users: [
      { key: '1', User: { nickname: '가' }, role: 'leader' },
      { key: '2', User: { nickname: '나' }, role: 'member' },
      { key: '3', User: { nickname: '다' }, role: 'member' },
      { key: '4', User: { nickname: '라' }, role: 'member' },
    ]
  };

  constructor(props) {
    super(props);

    // 소켓 생성
    this.socket = SocketIOClient(URL);
  }

  async componentDidMount() {
    // 현재 로그인한 유저의 그룹 정보를 요청하고
    // 멤버 정보와, 메뉴 정보를 업데이트 한다
    const meGroupResponse = await meApi.getMeGroup();
    if (meGroupResponse.ok !== true) {
      Alert.alert('알림', '그룹에 참여하지 않은 계정 입니다');
      return
    }

    // Me 에서 요청한 내 그룹 정보
    const meGroup = await meGroupResponse.json();

    // 그룹 아이디
    const groupId = meGroup.data.id;

    // 그룹 상세 정보 요청
    const groupResponse = await groupApi.getGroup(groupId);
    if (groupResponse.ok !== true) {
      Alert.alert('알림', '그룹 정보를 가져오지 못했습니다');
      return
    }

    // 내가 참여하고 있는 그룹 상세 정보
    const group = await groupResponse.json();
    const { Table, GroupMembers } = group.data;
    const { ShopId } = Table;

    // 상점 메뉴 정보
    const shopMenusResponse = await shopApi.getShopMenus(ShopId);
    if (shopMenusResponse.ok !== true) {
      Alert.alert('알림', '메뉴 정보를 가져오지 못했습니다');
      return
    }

    const shopMenus = await shopMenusResponse.json();

    // 그룹 정보 적용
    this.setState({
      users: GroupMembers.map(item => {
        return { key: `${item.id}`, ...item }
      }),
      menus: shopMenus.data,
      routes: shopMenus.data.map(category => {
        return { key: `${category.id}`, title: category.name }
      })
    });

    // 소켓 연결
    await this._connectAndRegisterSocket(groupId);
  }

  render() {
    return (
      <View style={styles.container}>
        {/* 멤버 정보와 결제 금액 정보가 나와있는 뷰 */}
        <View style={styles.sectionHeader}>
          <FlatList
            extraData={this.state}
            data={this.state.users}
            renderItem={({ item }) => <UserProfileListItem user={item}/>}
            horizontal={true}>
          </FlatList>
        </View>
        <View style={styles.priceGroup}/>
        {/* 메뉴 정보 */}
        <TabView
          navigationState={this.state}
          renderScene={this._renderScene}
          renderTabBar={this._renderTabBar}
          onIndexChange={index => this.setState({ index })}
          initialLayout={{ width: Dimensions.get('window').width, height: 0 }}
          style={styles.tabbar}
          labelStyle={styles.label}/>
      </View>
    )
  }

  _renderTabBar(props) {
    return (
      <TabBar
        {...props}
        scrollEnabled
        indicatorStyle={styles.indicator}
        style={styles.tabbar}
        tabStyle={styles.tab}
        labelStyle={styles.label}
      />
    )
  }

  _renderScene = ({ route }) => {
    if (this.state.routes.indexOf(route) !== this.state.index || !this.state.menus) {
      return <View/>;
    }

    const menu = this.state.menus.find(item => item.id === parseInt(route.key));
    if (!menu) {
      return <View/>
    }

    return <MenuList menus={menu.Menus}/>
  };

  async _connectAndRegisterSocket(groupId) {
    const token = await getAccessToken();

    // 그룹 조인 성공 여부가 넘어온다
    this.socket.on('join-group-result', (message) => {
      // TODO 실패 여부에 따른 처리
    });

    // 멤버가 소켓에 연결 되었을때
    this.socket.on('connect-member', (member) => {
      console.log('멤버 접속', member)
    });

    // 새로운 멤버가 그룹에 추가 되었을때
    this.socket.on('new-group-member', (member) => {
      this.state.users.push(Object.assign({}, member.data, { key: `${member.data.id}` }));
      this.setState(this.state);
    });

    // 방에 접속하면 조인을 요청한다
    this.socket.emit('join-group', { token, groupId });
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  sectionHeader: {
    height: 102,
    backgroundColor: '#393939',
  },
  item: {
    flex: 1,
    color: '#fff',
    opacity: 0.6
  },
  tabbar: {
    backgroundColor: '#ffffff'
  },
  label: {
    color: '#000',
    fontWeight: '400',
  },
  tab: {
    width: 120,
  },
  indicator: {
    backgroundColor: '#000',
  },
  priceGroup: {
    backgroundColor: '#2c2c2c',
    height: 51
  }
});
