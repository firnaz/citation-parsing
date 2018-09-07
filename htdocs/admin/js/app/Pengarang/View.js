Ext.define('tkidp.Pengarang.View',{
	requires :[
		'tkidp.Pengarang.Action',
		'tkidp.Pengarang.Data',
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
		me.Action = new tkidp.Pengarang.Action();
		me.Data = new tkidp.Pengarang.Data();
		me.Grid = Ext.create('Ext.grid.Panel', {
			title: 'Pengarang',
			store: me.Data.Store,
			columnLines: true,
			columns: [
				{text: 'No', xtype: 'rownumberer',width: 28, sortable: false},
				{text: 'Nama Pengarang',  dataIndex:'NamaPengarang', width:300},
				{text: 'Jumlah Dokumen',  dataIndex:'jumlah_dokumen', sortable: false},
				{header: 'Preview', hidden:false, width:50, align:'center', xtype:'actioncolumn',
					items: [{
						icon: 'images/icons/zoom.png',
						handler: function(grid, rowIndex, colIndex,item,record) {
							var ID = me.Grid.getStore().getAt(rowIndex).data.ID;
							var NamaPengarang = me.Grid.getStore().getAt(rowIndex).data.NamaPengarang;
							if(ID){
								me.Action.Form.getForm().findField('ID').setValue(ID);
								me.Action.Form.getForm().findField('NamaPengarang').setValue(NamaPengarang);
								me.Action.Grid.getStore().getProxy().extraParams={ID:ID};
								me.Action.Grid.getStore().load();
								me.Action.winShow();
							}else{
								Ext.MessageBox.alert('Konfirmasi','File Tidak Tersedia.');
							}
						}
					}]
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
		me.Action.FormAction.getForm().findField('ID').reset();
		me.Action.FormAction.getForm().findField('NamaPengarang').reset();
		me.Action.FormAction.getForm().findField('action').setValue('add');
		me.Action.winActionShow();
	},
	edit: function(){
		var me = this;
		var selectionModel = me.Grid.getSelectionModel();
		var selectedRow = selectionModel.getSelection();
		if (selectedRow.length>0) {
			me.Action.FormAction.getForm().findField('ID').reset();
			me.Action.FormAction.getForm().findField('NamaPengarang').reset();
			me.Action.FormAction.getForm().loadRecord(selectedRow[0]);
			me.Action.FormAction.getForm().findField('action').setValue('edit');
			me.Action.winActionShow();
		} else {
			Ext.MessageBox.alert('Konfirmasi','Pilihlah salah satu data yang akan diedit.');
		}

	},
	delete: function(){
		var me = this;
		var selectionModel = me.Grid.getSelectionModel();
		var selectedRow = selectionModel.getSelection();
		
		if (selectedRow.length>0) {
			var id		= selectedRow[0].data.ID;
			Ext.Msg.show({
				title:'Konfirmasi',
				msg:'Apakah anda bermaksud menghapus data tersebut?',
				buttons:Ext.Msg.YESNO,
				icon:Ext.Msg.QUESTION,
				fn:function(btn){
					if(btn=='yes'){
						Ext.Ajax.request({
							waitMsg: 'Sedang Memproses...',
							url: 'Pengarang/delete',
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