<?php 
class DuplikasiController extends Zend_Controller_Action
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
		
		if(!$dir) { $dir = 'DESC'; $sort='ID';}	
		
		$dokumen = new Dokumen();
		$data = $db->fetchAll($db->select()->
			from(array('a'=>'Dokumen'),array("a.*"))->order("$sort $dir")->join(array("b"=>"Skripsi"),"a.ID=b.ID",array("b.NRP","b.PembimbingID"))->limit($limit,$start)->where("filename is not null"));

		$total = $db->fetchRow($db->select()->from(array('Dokumen'),array('count(*) as total'))->join(array("b"=>"Skripsi"),"Dokumen.ID=b.ID")->where("filename is not null"));
		foreach ($data as $key=>$val){
			$id = $val['ID'];
			$pengarang = $this->_helper->Tesis->get_authors($id);
			$data[$key]['pengarang'] = $this->_helper->Tesis->merge_authors($pengarang);
			$datapengarang = explode("&", $data[$key]['pengarang']);
			$data[$key]['nama_mahasiswa'] = trim($pengarang[0]);
			$data[$key]['nama_pembimbing'] = trim($pengarang[1]);
		}
		$data = count($data)?$data:array();
	
		echo "{rows:".Zend_Json::encode($data).",total:$total[total]}";
	}

}

?>