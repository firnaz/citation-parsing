<?php
class IndexController extends Zend_Controller_Action
{
    public function indexAction(){
	}
    public function searchAction(){
    	require("sphinxapi.php");
    	$q = trim($_GET['q']);
    	$q = strip_tags($q);
    	$limit = 10;
    	$p = (isset($_GET['page']) && $_GET['page']>1)?$_GET['page']:1; 
    	$offset = ($p-1) * $limit; 
    	if(!$q){
    		header("Location:".$this->getRequest()->getBaseURL());
    	}
		$sl = new SphinxClient();
		$sl->SetServer('localhost', 9312);
		$sl->SetMatchMode (SPH_MATCH_ALL);
		$sl->SetSortMode (SPH_SORT_RELEVANCE);
		$sl->SetLimits($offset,$limit);
		$dokumen = new Dokumen();
		$pustaka = new Pustaka();
		if($q){
			$sl->SetFieldWeights(array("judul"=>4,"teks"=>2,"penerbit"=>1,"tahun"=>1,"pengarang"=>4));
			$spresult = $sl->Query($q, 'tkidp');
		}
		$page = array(); $matches = array(); $doc_arr = array(); $doc_id=array();
    	$page["query"]=$q;
		$options = array
		(
		        'before_match'          => '<span class="highlight_result">',
		        'after_match'           => '</span>',
		        'chunk_separator'       => '&#8230;',
		        'limit'                 => 200,
		        'around'                => 3,
		);	
		$starttime = microtime(true);
		if($spresult["total_found"]>0){
			$page["total_found"] = $spresult["total_found"];
			$page["current_page"] = $p;
			$maxPage = ceil($spresult["total_found"]/$limit);
			$page["total_page"] = $maxPage;
			foreach ($spresult['matches'] as $key => $row){
		  		$doc_arr[] = $key;
		  		$matches[$key] = $row;
			}
			foreach ($spresult['words'] as $k=>$v){
				$words[]=$k;
			}
			$doc_id = join(',', $doc_arr);
			$where = "ID in (".$doc_id.")";
			$rows = $dokumen->fetchAll($dokumen->select()->where($where)->order("field(ID, ".$doc_id.")"));
			$result = $rows->toArray();
			foreach($result as $key=>$row){
				$row['spresult'] = $matches[$row['ID']];
				$row['spresult']['bobot'] = number_format(($row['spresult']['weight']/((count($words)*8)))*100,2);
				$row['judul'] = $this->_helper->Tesis->highlightString($row['judul'],$words);
				if(trim($row['teks'])){
					$ex = $sl->BuildExcerpts(array($row['teks']), 'tkidp', $q, $options);
					$row['teks'] = $this->_helper->Tesis->highlightString($ex[0],$words);
				}
				$authors = $this->_helper->Tesis->get_authors($row["ID"]);
				$row["authors"] = $this->_helper->Tesis->merge_authors($authors,'<a href="pengarang?id={key}">','</a>');
				$rujukan = $pustaka->fetchAll("DokumenID=".$row['ID']);
				$row['cited'] = count($rujukan->toArray());
				$result[$key] = $row;
			}
			$page["result"] = $result;
		}
		$endtime = microtime(true);
		$page["search_time"] = number_format(($endtime - $starttime),4);
		$this->view->page = $page;
	}
    public function dokumenAction(){
    	$id = trim($_GET['id']);
    	$id = strip_tags($id);
		if(!$id && is_int($id)){
    		header("Location:".$this->getRequest()->getBaseURL());
    	}

    	$dokumen = new Dokumen();
    	$pengarang = new Pengarang();
    	$row = $dokumen->fetchRow("ID=".$id);
    	if($row){
	    	$doc = $row->toArray();
			$authors = $this->_helper->Tesis->get_authors($doc["ID"]);
			$doc["authors"] = $this->_helper->Tesis->merge_authors($authors,'<a href="pengarang?id={key}">','</a>');
			$class = ucwords($doc["tipe"]);
			if(file_exists(APPLICATION_PATH."/models/".$class.".php")){
				$jenis = new $class();
				$row = $jenis->fetchRow("ID=".$doc['ID']);
				if($row){
					$docdetail = $row->toArray();
					if ($docdetail['url']){
						$docdetail['url'] = preg_match("/^./", $docdetail['url'])?substr($docdetail['url'],0,-1):$docdetail['url'];
						$docdetail['url'] = preg_replace('/\s+/', '',$docdetail['url']);
					}
					if($docdetail['PembimbingID']){
						$pembimbing = $pengarang->fetchRow("ID='".$docdetail['PembimbingID']."'");
						// print_r($pembimbing);exit;
						$docdetail['pembimbing']= '<a href="pengarang?id='.$docdetail['PembimbingID'].'">'.$pembimbing->NamaPengarang.'</a>';
					}
					$doc['detail'] = array();
					$doc['detail']['jenis'] = $class;
					$doc['detail'] = array_merge($doc['detail'],$docdetail);
				}
			}
			$pustaka = new Pustaka();
			$rows = $pustaka->fetchAll("DokumenSumberID=".$doc['ID']);
			$daftarpustaka = $rows->toArray();
			$doc['DaftarPustaka'] = $daftarpustaka;
			$rows = $pustaka->fetchAll("DokumenID=".$doc['ID']);
			$rujukan = $rows->toArray();
			foreach($rujukan as $key=>$val){
				$doc['Dirujuk'][] = $dokumen->fetchRow("ID=".$val['DokumenSumberID']); 
			}
			$this->_helper->Tesis->array_sort_by_column($doc['Dirujuk'], 'tahun', SORT_DESC);
			$page['doc']=$doc;
    	}
		$this->view->page = $page;
	}
    public function pengarangAction(){
    	$id = trim($_GET['id']);
    	$id = strip_tags($id);
		if(!$id && is_int($id)){
    		header("Location:".$this->getRequest()->getBaseURL());
    	}

    	$pengarang = new Pengarang();
		$db = Zend_Db_Table_Abstract::getDefaultAdapter();
		$row = $pengarang->fetchRow("ID=".$id);
    	if($row){
	    	$pengarang = $row->toArray();
	    	$sql = "SELECT Dokumen.ID, 
						Dokumen.judul, 
						Dokumen.tipe, 
						Dokumen.penerbit, 
						Dokumen.tahun, 
						DokumenPengarang.PengarangID, 
						DokumenPengarang.urutan
					FROM Dokumen INNER JOIN DokumenPengarang ON Dokumen.ID = DokumenPengarang.DokumenID
					WHERE PengarangID='".$pengarang["ID"]."'
					ORDER BY Dokumen.tahun DESC, DokumenPengarang.urutan ASC";
			$dokumen = $db->fetchAll($sql);

			foreach($dokumen as $key=>$doc){
				$authors = $this->_helper->Tesis->get_authors($doc["ID"]);
				$dokumen[$key]['authors'] = $this->_helper->Tesis->merge_authors($authors,'<a href="pengarang?id={key}">','</a>');
			}
			$pustaka = new Pustaka();
			foreach ($dokumen as $key=>$val){
				$rows = $pustaka->fetchAll("DokumenID=".$val['ID']);
				$rujukan = $rows->toArray();
				$dokumen[$key]['cited'] = count($rujukan);
			}
			$pengarang['dokumen'] = $dokumen;
			$page['author'] = $pengarang;
    	}
		$this->view->page = $page;
	}
	public function authorsgraphAction(){
		$method = $this->getRequest()->getParam('method');
    	$id = trim($_GET['id']);
    	$id = strip_tags($id);
		if(!$id && is_int($id)){
			header("Location:".$this->getRequest()->getBaseURL());
		}
		$db = Zend_Db_Table_Abstract::getDefaultAdapter();
		$pengarang = new Pengarang();
    	$dokumenpengarang = new Dokumenpengarang();
		$authors=array();
		$row = $pengarang->fetchRow("ID=".$id);
		$author = $row->toArray();

    	//Dokumen yang di karang
    	$rows = $dokumenpengarang->fetchAll("PengarangID=".$id);
    	$Documents = $rows->toArray();

    	$authordumps = $this->_helper->Tesis->getCoAuthorNodes($id, $Documents,2,$authors);
    	$noChildrenNodes = array();
    	$withChildrenNodes = array();
		$this->_helper->Tesis->withChildrenNodes($authordumps,$withChildrenNodes);
    	$this->_helper->Tesis->noChildrenNodes($authordumps,$noChildrenNodes,$withChildrenNodes);
    	if($method=="ajax"){
			$sql="SELECT Dokumen.*, DokumenPengarang.urutan
					FROM Dokumen INNER JOIN DokumenPengarang ON Dokumen.ID = DokumenPengarang.DokumenID
						 INNER JOIN Pengarang ON DokumenPengarang.PengarangID = Pengarang.ID
						 WHERE Pengarang.ID=".$id." ORDER BY Dokumen.tahun DESC LIMIT 0,5";
			$documents = $db->fetchAll($sql);
			$this->_helper->viewRenderer->setNoRender();
			header("Access-Control-Allow-Origin: *");
			header("Access-Control-Allow-Headers: x-requested-with");
	    	header('Content-type: application/json');
	    	$ajax =array(
	    		"author"=> $author, 
	    		"authordumps"=>$authordumps,
	    		"noChildrenNodes"=>$noChildrenNodes,
	    		"documents"=>$documents
	    	);
	    	echo json_encode($ajax);
    	}elseif($method=="docs"){
			$this->_helper->viewRenderer->setNoRender();
			header("Access-Control-Allow-Origin: *");
			header("Access-Control-Allow-Headers: x-requested-with");
	    	header('Content-type: application/json');
	    	$to = $_GET['to'];
	    	$from = $_GET['from'];
	    	$i=0;
	    	if($to){
	    		$where = $to.',';
	    		$i++;
	    	}
	    	if($from){
	    		$where .= $from.',';
	    		$i++;
	    	}
	    	$where = substr($where,0,-1);
	    	$sql = "SELECT * FROM Dokumen WHERE Dokumen.ID IN(
	    				SELECT DokumenID FROM DokumenPengarang WHERE PengarangID IN($where) GROUP BY DokumenID HAVING count(*)>= $i
	    			) ORDER by tahun DESC LIMIT 0,5";
			$documents = $db->fetchAll($sql);			
	    	$ajax =array(
	    		"author"=> $author, 
	    		"documents"=>$documents
	    	);
	    	echo json_encode($ajax);    		
    	}else{
			$sql="SELECT Dokumen.*, DokumenPengarang.urutan
					FROM Dokumen INNER JOIN DokumenPengarang ON Dokumen.ID = DokumenPengarang.DokumenID
						 INNER JOIN Pengarang ON DokumenPengarang.PengarangID = Pengarang.ID
						 WHERE Pengarang.ID=".$id." ORDER BY Dokumen.tahun DESC LIMIT 0,5";
			$documents = $db->fetchAll($sql);
	    	$page['author'] = $author;
	    	$page['authordumps'] = $authordumps;
	    	$page['noChildrenNodes'] = $noChildrenNodes;
	    	$page['documents'] = $documents;
			$this->view->page = $page;
		}
	}
	public function citesgraphAction(){
		$method = $this->getRequest()->getParam('method');
    	$id = trim($_GET['id']);
    	$id = strip_tags($id);
    	$mode = trim($_GET['mode']);
		if(!$id && is_int($id)){
			header("Location:".$this->getRequest()->getBaseURL());
		}
		$db = Zend_Db_Table_Abstract::getDefaultAdapter();
		$pengarang = new Pengarang();
    	$dokumenpengarang = new Dokumenpengarang();
		$row = $pengarang->fetchRow("ID=".$id);
		$author = $row->toArray();

		$authors=array($author["ID"]);

    	//Dokumen yang di karang
    	$rows = $dokumenpengarang->fetchAll("PengarangID=".$id);
    	$Documents = $rows->toArray();

    	$authordumps = $this->_helper->Tesis->getCiteNodes($author, $Documents,2,$authors, $mode);
    	$noChildrenNodes = array();
    	$withChildrenNodes = array($author[ID]);
		$this->_helper->Tesis->withChildrenNodes($authordumps,$withChildrenNodes);
    	$this->_helper->Tesis->noChildrenNodes($authordumps,$noChildrenNodes,$withChildrenNodes);
		$sql="SELECT Dokumen.*, DokumenPengarang.urutan
				FROM Dokumen INNER JOIN DokumenPengarang ON Dokumen.ID = DokumenPengarang.DokumenID
					 INNER JOIN Pengarang ON DokumenPengarang.PengarangID = Pengarang.ID
					 WHERE Pengarang.ID=".$id." ORDER BY Dokumen.tahun DESC LIMIT 0,5";
		$documents = $db->fetchAll($sql);
    	if($method=="ajax"){
			$this->_helper->viewRenderer->setNoRender();
			header("Access-Control-Allow-Origin: *");
			header("Access-Control-Allow-Headers: x-requested-with");
	    	header('Content-type: application/json');
	    	$ajax =array(
	    		"author"=> $author, 
	    		"authordumps"=>$authordumps,
	    		"noChildrenNodes"=>$noChildrenNodes,
	    		"documents"=>$documents
	    	);
	    	echo json_encode($ajax);
    	}else{
	    	$page['author'] = $author;
	    	$page['authordumps'] = $authordumps;
	    	$page['noChildrenNodes'] = $noChildrenNodes;
	    	$page['documents'] = $documents;
			$this->view->page = $page;
		}
	}
	public function downloadimageAction(){
    	$data = trim($_POST['data']);
		$this->_helper->viewRenderer->setNoRender();
		$img = str_replace('data:image/png;base64,', '', $data);
		$img = str_replace(' ', '+', $img);
		$imgdata = base64_decode($img);
		header('Content-Description: File Transfer');
		header('Content-Type: application/force-download');
		header('Content-Transfer-Encoding: binary');
		header('Connection: Keep-Alive');
		header('Expires: 0');
		header('Content-Disposition: attachment;filename="graph.png"');
		echo $imgdata;
	}
}
?>