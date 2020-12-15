import {Component, expose, validators, provide} from '@layr/component';
import {Storable, primaryIdentifier, attribute} from '@layr/storable';
import {MemoryStore} from '@layr/memory-store';
import {ComponentHTTPServer} from '@layr/component-http-server';
import {WithRoles, role} from '@layr/with-roles';

const {notEmpty, maxLength} = validators;

export class Session extends Component {
  @expose({set: true})
  @attribute('string?')
  static secret?: string;

  static isAdmin() {
    return this.secret === process.env.ADMIN_SECRET;
  }
}

@expose({
  find: {call: true},
  prototype: {
    load: {call: true},
    save: {call: ['creator', 'admin']}
  }
})
export class Message extends WithRoles(Storable(Component)) {
  @provide() static Session = Session;

  @expose({get: true, set: true}) @primaryIdentifier() id!: string;
  @expose({get: true, set: true})
  @attribute("string", {validators: [notEmpty(), maxLength(300)]})
  text = "";

  @expose({get: true}) @attribute('Date') createdAt = new Date();

  @role('creator') creatorRoleResolver() {
    return this.isNew();
  }

  @role('admin') static adminRoleResolver() {
    return this.Session.isAdmin();
  }
}

const store = new MemoryStore();
store.registerStorable(Message);

const server = new ComponentHTTPServer(Message, {port: 3210});
server.start();
