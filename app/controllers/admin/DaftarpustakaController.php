<?php 
class DaftarpustakaController extends Zend_Controller_Action
{
    public function indexAction()
    {
		$this->_helper->layout->setLayout('template');    
	}
	
	public function viewpustakaAction()
	{
		$this->_helper->layout()->disableLayout();
		$this->_helper->viewRenderer->setNoRender();
		extract($this->getRequest()->getParams());
		$db = Zend_Db_Table_Abstract::getDefaultAdapter();
		
		if(!$dir) { $dir = 'ASC'; $sort='ID';}	
		
		$dokumen = new Dokumen();
		$data = $db->fetchAll($db->select()->
			from(array('a'=>'Dokumen'),array("a.*"))->order("$sort $dir")->join(array("b"=>"Pustaka"),"a.ID=b.DokumenID",array("PustakaID"=>"ID"))->where("DokumenSumberID='$ID'"));
		$total = $db->fetchRow($db->select()->from(array('Dokumen'),array('count(*) as total'))->join(array("b"=>"Pustaka"),"Dokumen.ID=b.DokumenID",array("PustakaID"=>"ID"))->where("DokumenSumberID='$ID'"));
		$data = count($data)?$data:array();
		foreach ($data as $key=>$val){
			$id = $val['ID'];
			$pengarang = $this->_helper->Tesis->get_authors($id);
			$data[$key]['pengarang'] = $this->_helper->Tesis->merge_authors($pengarang);
		}
	
		echo "{rows:".Zend_Json::encode($data).",total:$total[total]}";
	}
	public function viewdokumenAction()
	{
		$this->_helper->layout()->disableLayout();
		$this->_helper->viewRenderer->setNoRender();
		extract($this->getRequest()->getParams());
		$db = Zend_Db_Table_Abstract::getDefaultAdapter();
		
		if(!$dir) { $dir = 'ASC'; $sort='ID';}	
		
		$dokumen = new Dokumen();
		$data = $db->fetchAll($db->select()->
			from(array('a'=>'Dokumen'),array("a.*"))->order("$sort $dir")->join(array("b"=>"DokumenPengarang"),"a.ID=b.DokumenID")->where("PengarangID='$ID'"));
		$total = $db->fetchRow($db->select()->from(array('Dokumen'),array('count(*) as total'))->join(array("b"=>"DokumenPengarang"),"Dokumen.ID=b.DokumenID")->where("PengarangID='$ID'"));
		$data = count($data)?$data:array();
		foreach ($data as $key=>$val){
			$id = $val['ID'];
			$pengarang = $this->_helper->Tesis->get_authors($id);
			$data[$key]['pengarang'] = $this->_helper->Tesis->merge_authors($pengarang);
		}
	
		echo "{rows:".Zend_Json::encode($data).",total:$total[total]}";
	}	
}

?>