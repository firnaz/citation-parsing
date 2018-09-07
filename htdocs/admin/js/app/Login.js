Ext.require([
	'Ext.Ajax'
]);

Ext.define('tkidp.Login',{
	requires: [
		'Ext.form*',
		'Ext.panel.Panel',
		'Ext.button.Button',
		'Ext.EventObject*'
    ],
	constructor : function(){
		var me = this;
		me.login = Ext.create('Ext.form.Panel', {
			frame:false,
			title:'',
			border:false,
			defaultType:'textfield',
			bodyPadding:5,
			items:[new Ext.form.Hidden({name: 'action', value:'login'}),
				{
					fieldLabel:'Username',
					name:'loginUsername',
					fieldCls:'input',
					width:273,
					allowBlank:false,
					listeners : {
						specialkey : function(field, e) {
							if (e.getKey() == Ext.EventObject.ENTER) {
								var username = me.login.getForm().findField('loginUsername').getValue();
								if (username.length>0) {
									me.login.getForm().findField('loginPassword').focus(true,10);
								}
							}
						}
					}
				},{
					fieldLabel:'Password',
					name:'loginPassword',
					inputType:'password',
					fieldCls:'input',
					width:273,
					allowBlank:false,
					listeners:{
						specialkey : function(field, e) {
							if (e.getKey() == Ext.EventObject.ENTER) {
								var password = me.login.getForm().findField('loginPassword').getValue();
								if (password.length>0) {
									Ext.getCmp('submitButton').handler();
								}
							}
						}
					}
				}],
			buttons:[{
				text:'Login',
				id: 'submitButton',
				cls:'button',
				height:28,
				width:54,
				margin:1,
				handler:function(){
					if(me.login.getForm().isValid()){
						me.login.getForm().submit({
							url: 'login/login',
							waitMsg: 'Proses login ke sistem...',
							success:function(form,action){
								switch(action.result.success){
									case "true":
										window.location='index';
										break;
									case "false":
										Ext.MessageBox.alert('Error',action.result.reason);
										me.login.getForm().reset();
										break;
									default:
										Ext.MessageBox.alert('Error','Ada masalah dengan Koneksi Silahkan hubungi administrator!!');
										window.location='login/logout';
										break;
								}
							},
							failure:function(form,action){

							}
						});
					}else{
						Ext.MessageBox.alert('Error', 'Silakan periksa field yang masih kosong!!');
					}
				}
			}]
		});
		this.win = Ext.create('Ext.window.Window', {
			layout:'fit',
			width:300,
			closable: false,
			resizable: false,
			draggable: false,
			renderTo:'form',
			plain: false,
			border: 0,
			baseCls: '',
			shadow:false,
			items: [this.login]
		});
		this.win.show();
	}
});

Ext.onReady(function(){
  Login = new tkidp.Login();
});