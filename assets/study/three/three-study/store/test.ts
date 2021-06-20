import { action, observable } from 'mobx'
import Base from './base'

interface IProps {
  username: string 
}

export default class UserInfo extends Base<IProps> {

  @observable 
  username: string 

  @action
  setUserName = (name: string) => {
    this.username = name 
  }

}