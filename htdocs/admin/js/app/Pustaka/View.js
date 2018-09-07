Ext.define('tkidp.Pustaka.View',{
	requires :[
		'tkidp.Pustaka.Action',
		'tkidp.Pustaka.Data',
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
		me.Action = new tkidp.Pustaka.Action();
		me.Data = new tkidp.Pustaka.Data();
		me.Grid = Ext.create('Ext.grid.Panel', {
			title: 'Pustaka',
			store: me.Data.Store,
			columnLines: true,
			columns: [
				{text: 'No', xtype: 'rownumberer',width: 28, sortable: false},
				{text: 'Judul',  dataIndex:'judul', width:300, renderer:app.Util.wrap},
				{text: 'Pengarang',  dataIndex:'pengarang', width:300, renderer:app.Util.wrap},
				{text: 'Penerbit',  dataIndex:'penerbit', width:300, renderer:app.Util.wrap},
				{text: 'Tahun',  dataIndex:'tahun', width:50},
				{text: 'Tipe',  dataIndex:'tipe', width:50},
				{header: 'Preview', hidden:false, dataIndex:'filepath', width:50, align:'center', xtype:'actioncolumn',
					items: [{
						icon: 'images/icons/zoom.png',
						handler: function(grid, rowIndex, colIndex,item,record) {
							var ID = me.Grid.getStore().getAt(rowIndex).data.ID;
							// var Judul = me.Grid.getStore().getAt(rowIndex).data.judul;
							// var Penerbit = me.Grid.getStore().getAt(rowIndex).data.penerbit;
							// var Pengarang = me.Grid.getStore().getAt(rowIndex).data.pengarang;
							// var Tahun = me.Grid.getStore().getAt(rowIndex).data.tahun;
							var Tipe = me.Grid.getStore().getAt(rowIndex).data.tipe;
							if(ID){
								me.Action.formPreviewShow(Tipe);
								me.Action.FormPreview.getForm().loadRecord(me.Grid.getStore().getAt(rowIndex));
								me.Action.GridRujukan.getStore().getProxy().extraParams={ID:ID};
								me.Action.GridRujukan.getStore().load();
								me.Action.Tabs.setActiveTab(0);
								me.Action.winPreviewShow();
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
		me.Action.Form.getForm().findField('ID').reset();
		me.Action.Form.getForm().findField('judul').reset();
		me.Action.Form.getForm().findField('PengarangID').reset();
		me.Action.Form.getForm().findField('penerbit').reset();
		me.Action.Form.getForm().findField('tahun').reset();
		me.Action.Form.getForm().findField('file').setRawValue(null);
		me.Action.Form.getForm().findField('tipe').reset();
		me.Action.Form.getForm().findField('action').setValue('add');
		me.Action.winShow();
	},
	edit: function(){
		var me = this;
		var selectionModel = me.Grid.getSelectionModel();
		var selectedRow = selectionModel.getSelection();
		if (selectedRow.length>0) {
			me.Action.Form.getForm().findField('file').setRawValue(null);
			me.Action.Form.getForm().findField('ID').reset();
			me.Action.Form.getForm().findField('judul').reset();
			me.Action.Form.getForm().findField('PengarangID').reset();
			me.Action.Form.getForm().findField('penerbit').reset();
			me.Action.Form.getForm().findField('tahun').reset();
			me.Action.Form.getForm().findField('tipe').reset();
			me.Action.Form.getForm().findField('action').setValue('edit');
			me.Action.Form.getForm().loadRecord(selectedRow[0]);
			var PengarangID = selectedRow[0].data.PengarangID.split(",");
			me.Action.Form.getForm().findField('PengarangID').setValue(PengarangID);
			me.Action.winShow();
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
							url: 'Pustaka/delete',
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