Ext.define('tkidp.Duplikasi.View',{
	requires :[
		'tkidp.Duplikasi.Action',
		'tkidp.Duplikasi.Data',
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
		me.Action = new tkidp.Duplikasi.Action();
		me.Data = new tkidp.Duplikasi.Data();
		me.Grid = Ext.create('Ext.grid.Panel', {
			title: 'Duplikasi Dokumen',
			store: me.Data.Store,
			columnLines: true,
			columns: [
				{text: 'No', xtype: 'rownumberer',width: 28, sortable: false},
				{text: 'Judul',  dataIndex:'judul', width:300, renderer:app.Util.wrap},
				{text: 'Pengarang',  dataIndex:'pengarang', width:300, renderer:app.Util.wrap},
				{text: 'Penerbit',  dataIndex:'penerbit', width:200, renderer:app.Util.wrap},
				{text: 'Tahun',  dataIndex:'tahun', width:50},
				{text: 'Tipe',  dataIndex:'duplikasi', width:50},
				{text: 'Jumlah Duplikasi',  dataIndex:'duplikasi', width:100},
				{header: 'Preview', hidden:false, dataIndex:'filepath', width:50, align:'center', xtype:'actioncolumn',
					items: [{
						icon: 'images/icons/zoom.png',
						handler: function(grid, rowIndex, colIndex,item,record) {

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
				// {
				// 	text: 'Tambah',
				// 	iconCls: 'icon-page-add',
				// 	handler: function(){
				// 		me.add();
				// 	}
				// },
				// {
				// 	text: 'Ubah',
				// 	iconCls: 'icon-page-edit',
				// 	handler: function(){
				// 		me.edit();
				// 	}
				// }
			]
		});
	}
});