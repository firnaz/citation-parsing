<?php 
class PengarangController extends Zend_Controller_Action
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
		
		if(!$sort) { 
			$dir = 'DESC'; 
			$sort='ID';
		}else{
			$order = json_decode($sort);
			$dir = $order[0]->direction;
			$sort = $order[0]->property;
		}	
		
		$pengarang = new Pengarang();
		$data = $pengarang->fetchAll($pengarang->select()->order("$sort $dir")->limit($limit,$start));

		$total = $db->fetchRow($db->select()->from(array('Pengarang'),array('count(*) as total')));
		$data = count($data)?$data->toArray():array();
		foreach ($data as $key=>$val){
			$id = $val['ID'];
			$jumlah_dokumen = $db->fetchRow($db->select()->from(array('DokumenPengarang'),array('count(*) as total'))->where("PengarangID='$id'"));
			$data[$key]["jumlah_dokumen"] = $jumlah_dokumen["total"];
		}
	
		echo "{rows:".Zend_Json::encode($data).",total:$total[total]}";
	}
	public function addAction(){
		$this->_helper->layout()->disableLayout();
		$this->_helper->viewRenderer->setNoRender();
		
		extract($this->getRequest()->getParams());

		$pengarang = new Pengarang();
		$row  = $pengarang->createRow();
		$row->NamaPengarang 	= $NamaPengarang;
		$row->save();
		$result["success"] = "true";
		echo Zend_Json::encode($result);
	}
	function editAction()
	{
		$this->_helper->layout()->disableLayout();
		$this->_helper->viewRenderer->setNoRender();
		
		extract($this->getRequest()->getParams());

		$pengarang = new Pengarang();

		$data['NamaPengarang'] =$NamaPengarang;
		
		$where = $pengarang->getAdapter()->quoteInto('ID= ?', $ID);
		$pengarang->update($data, $where);

		$result["success"] = "true";
		echo json_encode($result);
	}
	public function deleteAction()
	{
		$this->_helper->layout()->disableLayout();
		$this->_helper->viewRenderer->setNoRender();
		extract($this->getRequest()->getParams());
		
		$pengarang = new Pengarang();

		$where = $pengarang->getAdapter()->quoteInto('ID= ?', $ID);
		$pengarang->delete($where);
		$result["success"] = "true";
		echo json_encode($result);
	}
}

?>