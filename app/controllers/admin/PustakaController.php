<?php 
class PustakaController extends Zend_Controller_Action
{
    public function indexAction()
    {
		$this->_helper->layout->setLayout('template');    
	}
	public function viewAction()
	{
		$this->_helper->layout()->disableLayout();
		$this->_helper->viewRenderer->setNoRender();
		extract($this->getRequest()->getParams());
		$db = Zend_Db_Table_Abstract::getDefaultAdapter();
		
		if(!$dir) { $dir = 'ASC'; $sort='ID';}	
		
		$dokumen = new Dokumen();
		$data = $db->fetchAll($db->select()->
			from(array('a'=>'Dokumen'),array("a.*"))->joinLeft(array("b"=>"Jurnal"),"b.ID=a.ID",array("nama_jurnal","volume","halaman"))->joinLeft(array("c"=>"Prosiding"),"c.ID=a.ID",array("nama_prosiding","lokasi","tanggal"))->joinLeft(array("d"=>"Website"),"d.ID=a.ID",array("url"))->order("$sort $dir")->limit($limit,$start));
		$total = $db->fetchRow($db->select()->from(array('Dokumen'),array('count(*) as total')));
		$data = count($data)?$data:array();
		foreach ($data as $key=>$val){
			$id = $val['ID'];
			$pengarang = $this->_helper->Tesis->get_authors($id);
			$pengarangid = $this->_helper->Tesis->getPengarangID($id);
			$data[$key]['pengarang'] = $this->_helper->Tesis->merge_authors($pengarang);
			$data[$key]['PengarangID'] = implode(",",$pengarangid);
			//$data[$key]['PengarangID'] = $pengarang;
		}
	
		echo "{rows:".Zend_Json::encode($data).",total:$total[total]}";
	}
	public function viewrujukanAction(){
		$this->_helper->layout()->disableLayout();
		$this->_helper->viewRenderer->setNoRender();
		extract($this->getRequest()->getParams());
		$db = Zend_Db_Table_Abstract::getDefaultAdapter();
		if(!$dir) { $dir = 'ASC'; $sort='ID';}	
		$data = $db->fetchAll($db->select()->
			from(array('a'=>'Dokumen'),array("a.*"))->join(array("b"=>"Pustaka"),"b.DokumenSumberID=a.ID","b.entri_daftar_pustaka")->where("b.DokumenID='$ID'")->order("$sort $dir")->limit($limit,$start));
		$total = $db->fetchRow($db->select()->from(array('Dokumen'),array('count(*) as total'))->join(array("b"=>"Pustaka"),"b.DokumenSumberID=Dokumen.ID","b.entri_daftar_pustaka")->where("b.DokumenID='$ID'"));
		$data = count($data)?$data:array();
		foreach ($data as $key=>$val){
			$id = $val['ID'];
			$pengarang = $this->_helper->Tesis->get_authors($id);
			$pengarangid = $this->_helper->Tesis->getPengarangID($id);
			$data[$key]['pengarang'] = $this->_helper->Tesis->merge_authors($pengarang);
			$data[$key]['PengarangID'] = implode(",",$pengarangid);
			//$data[$key]['PengarangID'] = $pengarang;
		}
	
		echo "{rows:".Zend_Json::encode($data).",total:$total[total]}";				
	}
	public function addAction(){
		$this->_helper->layout()->disableLayout();
		$this->_helper->viewRenderer->setNoRender();
		
		$data = $this->getRequest()->getParams();
		extract($data);
		$dokumen = new Dokumen();
		$upload = new Zend_File_Transfer_Adapter_Http();
		$upload->addValidator('Extension', false, array('pdf','case'=>true))
			   ->addValidator('Size', false, array('max' => '10000kB'));
		$rowdoc  = $dokumen->createRow();
		$rowdoc->judul 				= $judul;
		$rowdoc->penerbit 			= $penerbit;
		$rowdoc->tahun 				= $tahun;
		$rowdoc->tipe 				= $tipe;
		if($_FILES['file']['name']!==''){
			$filepdf = md5(date('YmdHis'));
			$filepath = PDFDIR."/".$filepdf;
			$upload->addFilter('Rename', $filepath);
			$upload->receive();

			$rowdoc->file = $filepdf;
			$rowdoc->filename = $_FILES['file']['name'];
			$content = $this->_helper->Tesis->pdf2txt($filepdf);
			$rowdoc->teks = $content;
		}
		$DocID = $rowdoc->save();
		$this->_helper->Tesis->saveDoc($tipe,$DocID,$data);
		$PengarangID = explode(",",$pengarangid);
		$this->_helper->Tesis->savePengarang($DocID,$PengarangID);
		$result["success"] = "true";
		echo json_encode($result);
	}
	public function editAction(){
		$this->_helper->layout()->disableLayout();
		$this->_helper->viewRenderer->setNoRender();
		
		$data = $this->getRequest()->getParams();
		extract($data);
		$dokumen = new Dokumen();
		$upload = new Zend_File_Transfer_Adapter_Http();
		$upload->addValidator('Extension', false, array('pdf','case'=>true))
			   ->addValidator('Size', false, array('max' => '10000kB'));
		$where = $dokumen->getAdapter()->quoteInto('ID= ?', $ID);
		$datadok["judul"] = $judul;
		$datadok["penerbit"] = $penerbit;
		$datadok["tahun"] = $tahun;
		$datadok["tipe"] = $tipe;
		if($_FILES['file']['name']!==''){
			$filepdf = md5(date('YmdHis'));
			$filepath = PDFDIR."/".$filepdf;
			$upload->addFilter('Rename', $filepath);
			$upload->receive();

			$datadok["file"] = $filepdf;
			$datadok["filename"] = $_FILES['file']['name'];
			$content = $this->_helper->Tesis->pdf2txt($filepdf);
			$datadok["teks"] = $content;
		}
		$dokumen->update($datadok,$where);
		$this->_helper->Tesis->saveDoc($tipe,$ID,$data);

		$PengarangID = explode(",",$pengarangid);
		$this->_helper->Tesis->savePengarang($ID,$PengarangID);		
		$result["success"] = "true";
		echo json_encode($result);
	}
	public function deleteAction(){
		$this->_helper->layout()->disableLayout();
		$this->_helper->viewRenderer->setNoRender();
		
		$data = $this->getRequest()->getParams();
		extract($data);
		$dokumen = new Dokumen();
		$dokumenpengarang = new DokumenPengarang();
		$pustaka = new Pustaka();
		$website = new Website();
		$jurnal = new Jurnal();
		$prosiding = new Prosiding();
		$skripsi = new Skripsi();
		$where = $dokumen->getAdapter()->quoteInto('ID= ?', $ID);
		$dokumen->delete($where);
		$dokumenpengarang->delete("DokumenID='$ID'");
		$pustaka->delete($where);
		$jurnal->delete($where);
		$prosiding->delete($where);
		$website->delete($where);
		$skripsi->delete($where);

		$result["success"] = "true";
		echo json_encode($result);
	}
}

?>