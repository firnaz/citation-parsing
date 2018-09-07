Ext.define('tkidp.Pustaka.Data',{
	requires :[
		'Ext.data.Store'
	],
	Store : null,
	Field : null,
	constructor: function(){
		var me = this;
		me.Field = [
			{name:'ID',	type: 'string', mapping: 'ID'},
			{name:'judul',	type: 'string', mapping: 'judul'},
			{name:'pengarang',	type: 'string', mapping: 'pengarang'},
			{name:'PengarangID',	type: 'string', mapping: 'PengarangID'},
			{name:'penerbit',	type: 'string', mapping: 'penerbit'},
			{name:'tahun',	type: 'string', mapping: 'tahun'},
			{name:'tipe',	type: 'string', mapping: 'tipe'},
			{name:'nama_jurnal',	type: 'string', mapping: 'nama_jurnal'},
			{name:'volume',	type: 'string', mapping: 'volume'},
			{name:'halaman',	type: 'string', mapping: 'halaman'},
			{name:'nama_prodising',	type: 'string', mapping: 'nama_prodising'},
			{name:'lokasi',	type: 'string', mapping: 'lokasi'},
			{name:'tanggal',	type: 'date', mapping: 'tanggal', dateFormat:'Y-m-d'},
			{name:'url',	type: 'string', mapping: 'url'}
		];
		me.Store = Ext.create('Ext.data.Store',{
			fields : me.Field,
			proxy: {
				type: 'ajax',
				url : 'Pustaka/view',
				reader: {
					type: 'json',
					root:'rows',
					totalProperty: 'total'
				}
			},
			remoteSort: true
		});
		me.FieldRujukan = [
			{name:'ID',	type: 'string', mapping: 'ID'},
			{name:'judul',	type: 'string', mapping: 'judul'},
			{name:'pengarang',	type: 'string', mapping: 'pengarang'},
			{name:'penerbit',	type: 'string', mapping: 'penerbit'},
			{name:'tahun',	type: 'string', mapping: 'tahun'},
			{name:'tipe',	type: 'string', mapping: 'tipe'}
		];
		me.StoreRujukan = Ext.create('Ext.data.Store',{
			fields : me.FieldRujukan,
			proxy: {
				type: 'ajax',
				url : 'Pustaka/viewrujukan',
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