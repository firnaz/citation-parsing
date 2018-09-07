<?php
class IndexController extends Zend_Controller_Action
{
    public function indexAction()
    {
	}
    public function testAction()
    {
    	echo "a";
	}
	public function headerAction(){
		$this->_helper->layout->setLayout('header');    	
	}
}
?>