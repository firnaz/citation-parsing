Ext.define('tkidp.User.Data',{
	requires :[
		'Ext.data.Store'
	],
	Store : null,
	Field : null,
	constructor: function(){
		var me = this;
		me.Field = [
			{name:'username',	type: 'string', mapping: 'username'},
			{name:'tipeuser',	type: 'string', mapping: 'usertype'},
			{name:'email',	type: 'string', mapping: 'email'},
			{name:'status',	type: 'string', mapping: 'status'}
		 ];
		me.Store = Ext.create('Ext.data.Store',{
			fields : me.Field,
			proxy: {
				type: 'ajax',
				url : 'user/view',
				reader: {
					type: 'json',
					root:'rows',
					totalProperty: 'total'
				}
			},
			remoteSort: true
		});
	}
});