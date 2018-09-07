Ext.define('tkidp.Dokumen.Data',{
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
			{name:'nama_mahasiswa',	type: 'string', mapping: 'nama_mahasiswa'},
			{name:'nrp',	type: 'string', mapping: 'NRP'},
			{name:'nama_pembimbing',	type: 'string', mapping: 'nama_pembimbing'},
			{name:'penerbit',	type: 'string', mapping: 'penerbit'},
			{name:'tahun',	type: 'string', mapping: 'tahun'},
			{name:'filepath',	type: 'string', mapping: 'filepath'}
		];
		me.Store = Ext.create('Ext.data.Store',{
			fields : me.Field,
			proxy: {
				type: 'ajax',
				url : 'Dokumen/view',
				reader: {
					type: 'json',
					root:'rows',
					totalProperty: 'total'
				}
			},
			remoteSort: true
		});
		me.FieldDaftarPustaka = [
			{name:'ID',	type: 'string', mapping: 'ID'},
			{name:'judul',	type: 'string', mapping: 'judul'},
			{name:'pengarang',	type: 'string', mapping: 'pengarang'},
			{name:'penerbit',	type: 'string', mapping: 'penerbit'},
			{name:'tahun',	type: 'string', mapping: 'tahun'},
			{name:'tipe',	type: 'string', mapping: 'tipe'}
		];
		me.StoreDaftarPustaka = Ext.create('Ext.data.Store',{
			fields : me.FieldDaftarPustaka,
			proxy: {
				type: 'ajax',
				url : 'Daftarpustaka/viewpustaka',
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