Ext.define('tkidp.User.View',{
	requires :[
		'tkidp.User.Action',
		'tkidp.User.Data',
		'Ext.grid.*',
		'Ext.window.*',
		'Ext.PagingToolbar',
		'Ext.toolbar.Paging'
	],
	Grid:null,
	Win:null,
	Action:null,
	Data:null,
	constructor:function(){
		var me = this;
		me.Action = new tkidp.User.Action();
		me.Data = new tkidp.User.Data();
		me.Grid = Ext.create('Ext.grid.Panel', {
			title: 'Manajemen Pengguna',
			store: me.Data.Store,
			columnLines: true,
			columns: [
				{text: 'No', xtype: 'rownumberer',width: 28, sortable: false},
				{text: 'Nama Pengguna',  dataIndex:'username', width:100},
				{text: 'Email',  dataIndex:'email', width:180},
				{text: 'Tipe Pengguna',  dataIndex:'tipeuser', width:100,
					renderer: function(value){
						switch(value){
							case "super_admin":
								return "Administrator";
								break;
							case "operator":
								return "Operator";
								break;
						}
					}
				},
				{text: 'Status',  dataIndex:'status', width:100,
					renderer:function(value)
					{
						//alert(value);
						return value==1 ? "Tidak Aktif" : "Aktif"; 
					}
				}
			],
			bbar: Ext.create('Ext.PagingToolbar', {
				store: me.Data.Store,
				beforePageText : "Halaman",
				afterPageText : "dari {0}",
				firstText : "Halaman Pertama",
				lastText : "Halaman Terakhir",
				nextText : "Halaman Selanjutnya",
				prevText : "Halaman Sebelumnya",
				displayInfo : true,
				displayMsg  : "Menampilkan data {0} s.d {1} dari {2} Data"
			}),

			tbar: [
			   {
					text: 'Tambah',
					iconCls: 'icon-page-add',
					handler: function(){
						me.add();
					}
			   },
			   {
					text: 'Ubah',
					iconCls: 'icon-page-edit',
					handler: function(){
						me.edit();
					}
			   },
			   {
					text: 'Hapus',
					iconCls: 'icon-page-delete',
					handler: function(){
						me.delete();
					}
				}
			]
		});
	},
	add : function(){
		var me = this;
		me.Action.Form.getForm().reset();
		me.Action.Form.getForm().findField('action').setValue('add');
		me.Action.Form.getForm().findField('username').enable();
		me.Action.winShow();
	},
	edit: function(){
		var me = this;
		var selectionModel = me.Grid.getSelectionModel();
		var selectedRow = selectionModel.getSelection();
		if (selectedRow.length>0) {
			me.Action.Form.getForm().reset();
			me.Action.Form.getForm().findField('action').setValue('edit');
			me.Action.Form.getForm().loadRecord(selectedRow[0]);
			me.Action.winShow();
			var id	= selectedRow[0].data.username;
			me.Action.Form.getForm().findField('ID').setValue(id);
			me.Action.Form.getForm().findField('username').disable();	
			
			me.Action.Form.getForm().findField('password').allowBlank=true;		
		} else {
			Ext.MessageBox.alert('Konfirmasi','Pilihlah salah satu data yang akan diedit.');
		}

	},
	delete: function(){
		var me = this;
		var selectionModel = me.Grid.getSelectionModel();
		var selectedRow = selectionModel.getSelection();
		
		if (selectedRow.length>0) {
			var id		= selectedRow[0].data.username;					
		
			Ext.Msg.show({
				title:'Konfirmasi',
				msg:'Apakah anda bermaksud menghapus data tersebut?',
				buttons:Ext.Msg.YESNO,
				icon:Ext.Msg.QUESTION,
				fn:function(btn){
					if(btn=='yes'){
						
						Ext.Ajax.request({   
							waitMsg: 'Sedang Memproses...',
							url: 'user/delete',
							params: {
								ID:	id
							}, 
							success: function(response){							
								var result= Ext.JSON.decode(response.responseText);
								switch(result.success){
									case "true":
										me.Grid.getStore().load();
										break;
									default:
										Ext.MessageBox.alert('Uh uh...','We couldn\'t save him...');
										break;
								}
							},
							failure: function(response){
								 var result=response.responseText;
								 Ext.MessageBox.alert('error','could not connect to the database. retry later');		
							}									    
					   });   
					}
				}
			});
		} else {
			Ext.MessageBox.alert('Konfirmasi','Pilihlah salah satu data yang akan dihapus!');
		}
	},
	getStore : function(){
		var me = this;
		return me.Data.Store.getStore();
	}
});