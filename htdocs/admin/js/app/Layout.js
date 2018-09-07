// JavaScript Document
Ext.define('tkidp.Layout',{
	requires: [
		'Ext.container.Viewport',
		'Ext.button.Button',
		'Ext.tree.*',
		'Ext.window.MessageBox',
		'Ext.data.TreeStore'
    ],
	MainPanel:null,
	HeaderPanel:null,
	viewport:null,
	LoadingMask:null,
	NavPanel: null,
	CurEl:null,
	TreeStore:null,
	constructor: function (){
		var me= this;
		me.MainPanel = new Ext.panel.Panel({
			layout:'card',
			xtype:"panel",
			region:"center",
			bodyStyle:'background-color: #CCCCC'
		});
		me.TreeStore = new Ext.data.TreeStore({
			proxy: {
				type: 'ajax',
				url: 'util/navigasi'
			}
		});
		me.NavPanel = new Ext.tree.Panel({
			title: 'Navigasi',
			region:'west',
			split: true,
			width: 260,
			minSize: 175,
			maxSize: 400,
			collapsible: true,
			enableDD:false,
			autoScroll: true,
			rootVisible: false,
			lines: false,
			singleExpand: false,
			useArrows: true,
			store : me.TreeStore,
			listeners:{
				itemclick:function(view, node){
					if (node.data.leaf && me.CurEl!=node.data.id){
						me.CurEl = node.data.id;
						if(Ext.getCmp('panel-'+me.CurEl)){
							me.MainPanel.layout.setActiveItem('panel-'+me.CurEl);
							eval('app.'+me.CurEl+'.init()');
						}else{
							me.LoadingMask.show();
							var newnode = new Ext.Panel({
								id: 'panel-'+me.CurEl,
								layout: 'fit'
							});
							me.MainPanel.add(newnode);
							me.MainPanel.layout.setActiveItem('panel-'+me.CurEl);
							Ext.require(
								[
									'tkidp.'+me.CurEl+'.Load'
								],
								function(){
									eval('app.'+me.CurEl+'= new tkidp.'+me.CurEl+'.Load()');
									eval('newnode.add(app.'+me.CurEl+'.getView())');
									newnode.doLayout();
									me.LoadingMask.hide();
								}
							);
						}
					}
				}
			},
			tbar: [{
				text: 'Setting',
				// hidden:true,
				iconCls: 'icon-page-gear',
				menu: [{
					text: 'Pengguna Sistem',
					iconCls: 'icon-user',
					hidden:app.usertype=="super_admin"?false:true,
					handler:function(){
						if (me.CurEl!='User'){
							me.CurEl='User';
							if(Ext.isDefined(app.User)){
								me.MainPanel.layout.setActiveItem('panel-'+me.CurEl);
								app.User.init();
							}else{
								me.LoadingMask.show();
								var newnode = new Ext.Panel({
									id: 'panel-'+me.CurEl,
									layout: 'fit',
									border:0
								});
								me.MainPanel.add(newnode);
								me.MainPanel.layout.setActiveItem('panel-'+me.CurEl);
								Ext.require(
									[
										'tkidp.User.Load'
									],
									function(){
										app.User = new tkidp.User.Load();
										newnode.add(app.User.getView());
										newnode.doLayout();
										me.LoadingMask.hide();
									}
								);
							}
						}
					}
				},{
					text: 'Pergantian Password',
					iconCls: 'icon-password',
					handler:function(){
						if (me.CurEl!='Password'){
							me.CurEl='Password';
							if(Ext.isDefined(app.Password)){
								me.MainPanel.layout.setActiveItem('panel-'+me.CurEl);
								app.Password.init();
							}else{
								me.LoadingMask.show();
								var newnode = new Ext.Panel({
									id: 'panel-'+me.CurEl,
									layout: 'fit',
									border:0
								});
								me.MainPanel.add(newnode);
								me.MainPanel.layout.setActiveItem('panel-'+me.CurEl);
								Ext.require(
									[
										'tkidp.Password.Load'
									],
									function(){
										app.Password = new tkidp.Password.Load();
										newnode.add(app.Password.getView());
										newnode.doLayout();
										me.LoadingMask.hide();
									}
								);
							}
						}
					}
				}]
			},'->',{
				text: 'Logout',
				// hidden:true,
				iconCls: 'icon-logout',
				handler:function(){
					Ext.Msg.show({
						title:'Konfirmasi',
						msg:'Apakah anda bermaksud logout dari sistem?',
						buttons:Ext.Msg.YESNO,
						icon:Ext.Msg.QUESTION,
						fn:function(btn){
							if(btn=='no'){

							}
							if(btn=='yes'){
								window.location='login/logout';
							}
						}
					});
				}
			}]
		});
		me.HeaderPanel = new Ext.panel.Panel({
			layout:'fit',
			xtype:"panel",
			region:"north"
		});
		me.viewport = new Ext.container.Viewport({
			layout:'border',
			margins:'93 5 5 0',
			items:[me.MainPanel,me.NavPanel]
		});
		me.LoadingMask = new Ext.LoadMask(Ext.getBody(), {msg:"Sedang Memproses...",id:'loadMask'});
		Ext.tip.QuickTipManager.init();
	}
});