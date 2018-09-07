<?php 
class StoreController extends Zend_Controller_Action
{
    public function init()
    {
        /* Initialize action controller here */
		$this->view->_URL=$this->getRequest()->getBaseUrl();
		$this->_helper->layout()->disableLayout();
		$this->_helper->viewRenderer->setNoRender();		
    }
    public function indexAction()
    {

    }
	public function pengarangAction(){
		$pengarang = new Pengarang();
		$data = $pengarang->fetchAll($pengarang->select()->order("NamaPengarang ASC"));
		echo  "{rows:".Zend_Json::encode($data->toArray())."}";
	}

}
?>