Ext.define('tkidp.Pengarang.Data',{
	requires :[
		'Ext.data.Store'
	],
	Store : null,
	Field : null,
	constructor: function(){
		var me = this;
		me.Field = [
			{name:'ID',	type: 'string', mapping: 'ID'},
			{name:'NamaPengarang',	type: 'string', mapping: 'NamaPengarang'},
			{name:'jumlah_dokumen',	type: 'string', mapping: 'jumlah_dokumen'}
		];
		me.Store = Ext.create('Ext.data.Store',{
			fields : me.Field,
			proxy: {
				type: 'ajax',
				url : 'Pengarang/view',
				reader: {
					type: 'json',
					root:'rows',
					totalProperty: 'total'
				}
			},
			remoteSort: true
		});
		me.FieldPustaka = [
			{name:'ID',	type: 'string', mapping: 'ID'},
			{name:'judul',	type: 'string', mapping: 'judul'},
			{name:'pengarang',	type: 'string', mapping: 'pengarang'},
			{name:'penerbit',	type: 'string', mapping: 'penerbit'},
			{name:'tahun',	type: 'string', mapping: 'tahun'},
			{name:'tipe',	type: 'string', mapping: 'tipe'}
		];
		me.StorePustaka = Ext.create('Ext.data.Store',{
			fields : me.FieldPustaka,
			proxy: {
				type: 'ajax',
				url : 'Daftarpustaka/viewdokumen',
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