// JavaScript Document
Ext.define('tkidp.User.Action',{
	requires: [
		'Ext.form*',
		'Ext.panel.Panel',
		'Ext.button.Button'
    ],
	Win : null,
	Form : null,
	constructor : function(){
		var me = this;
		me.Form = Ext.create('Ext.form.Panel', {
			frame:true,
			bodyStyle:'padding:5px 5px 0',
			border:false,
			defaultType: 'textfield',
			items: [
				new Ext.form.Hidden({name: 'ID'}),
				new Ext.form.Hidden({name: 'action'}),
				{
					fieldLabel: 'Username',
					name: 'username',
					width:400,
					labelWidth: 200,
					allowBlank:false
				},
				{
					fieldLabel: 'Password',
					name: 'password',
					width:400,
					labelWidth: 200,
					inputType : "password",
					allowBlank:false
				},
				{
					fieldLabel: 'Email',
					name: 'email',
					width:400,
					labelWidth: 200,
					vtype : 'email',
					allowBlank:true
				},
				new Ext.form.field.ComboBox({
					 fieldLabel: 'Tipe User',
					 width:400,
					 labelWidth: 200,
					 name: 'tipeuser',
					 store:[
						["super_admin", "Admin"],
						["operator", "Operator"],
					],
					 allowBlank: true,
					 triggerAction: 'all',
					 forceSelection :true
				}),
				new Ext.form.field.Checkbox({
					fieldLabel : "Tidak Aktif",
					labelWidth: 200,
					height: 'auto',
					width: 'auto',
					name : "status",
					value : "1"
				})
			]
		}); 
		me.Win = Ext.create('Ext.window.Window', {
			id: 'UserWindow',
			title: 'Manajemen Pengguna',
			closeAction:'hide',
			closable: true,
			bodyStyle: 'padding: 5px;',
			width: 500,
			resizable : true,
			height: 275,
			plain:true,
			layout: 'fit',
			bodyStyle: 'padding:5px;',
			modal:true,
			items: [ me.Form ],
			buttons: [
				{
					text: 'Tutup',
					handler: function(){
						me.Win.hide();
					}
				},
				{
					text: 'Reset',
					handler: function(){
						me.Form.getForm().reset();
					}
				},
				{
					text: 'Simpan',
					type: 'submit',
					handler : function()
					{
						if (me.Form.getForm().isValid()) {
							var action = me.Form.getForm().findField('action').getValue();
								var url="user/"+me.Form.getForm().findField('action').getValue();
								Ext.Ajax.request({   
									waitMsg: 'Please wait...',
									url: url,
									params: {
										username	 : me.Form.getForm().findField('username').getValue(),
										password : me.Form.getForm().findField('password').getValue(),
										email : me.Form.getForm().findField('email').getValue(),
										tipeuser	: me.Form.getForm().findField('tipeuser').getValue(),
										status : me.Form.getForm().findField('status').getValue()==true ? 1 : 0
									}, 
									success: 
										function(response){							
											var result= Ext.JSON.decode(response.responseText);
											switch(result.success){
											case "true":
												app.User.getView().getStore().load();
												me.Form.getForm().reset();
												me.Win.hide();
												break;
											case "false":
												Ext.MessageBox.alert('Error',result.reason);
												break;
											default:
												Ext.MessageBox.alert('Error','Tidak dapat menyimpan data');
												break;
											}
										},
									failure: 
										function(response){
											var result=response.responseText;
											Ext.MessageBox.alert('error','could not connect to the database. retry later');		
										}									    
								});
						} else {
							Ext.MessageBox.alert('Error', 'Silakan periksa field yang masih kosong!!');
						}
					}
				}
			]
		});
	},
	winShow:function(){
		this.Win.show();
	}
});