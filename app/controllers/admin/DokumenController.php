<?php 
class DokumenController extends Zend_Controller_Action
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
		$pengarang = new Pengarang();

		$data = $db->fetchAll($db->select()->
			from(array('a'=>'Dokumen'),array("a.ID","a.judul","a.tipe","a.penerbit","a.tahun","a.file","a.filename"))->order("$sort $dir")->join(array("b"=>"Skripsi"),"a.ID=b.ID",array("b.NRP","b.PembimbingID"))->limit($limit,$start)->where("filename is not null"));

		$total = $db->fetchRow($db->select()->from(array('Dokumen'),array('count(*) as total'))->join(array("b"=>"Skripsi"),"Dokumen.ID=b.ID")->where("filename is not null"));
		foreach ($data as $key=>$val){
			$id = $val['ID'];
			$mahasiswa = $this->_helper->Tesis->get_authors($id);
			$data[$key]['pengarang'] = $this->_helper->Tesis->merge_authors($mahasiswa);
			$datapengarang = explode(",", $data[$key]['pengarang']);
			$data[$key]['nama_mahasiswa'] = trim($datapengarang[0]);
			$pembimbing = $pengarang->fetchRow("ID='".$val["PembimbingID"]."'");
			$data[$key]['nama_pembimbing'] = trim($pembimbing->NamaPengarang);
		}
		$data = count($data)?$data:array();
	
		echo "{rows:".Zend_Json::encode($data).",total:$total[total]}";
	}
	public function addAction(){
		$this->_helper->layout()->disableLayout();
		$this->_helper->viewRenderer->setNoRender();
		$db = Zend_Db_Table_Abstract::getDefaultAdapter();
		extract($this->getRequest()->getParams());

		$dokumen = new Dokumen();
		$skripsi = new Skripsi();
		$dokumenpengarang = new Dokumenpengarang();
		$pDokumen = new Pengarang();
		$pustaka = new Pustaka();
		$failed = new TestMetadataFailed;
		$pengarang = $this->_helper->Tesis->formatNamaPengarang($pengarang);
		$pembimbing =$this->_helper->Tesis->formatNamaPengarang($pembimbing);
		$authors = array($pengarang,$pembimbing);
		$checkdoc = $this->_helper->Tesis->checkdoc($authors,$judul,$tahun);

		if(!count($checkdoc)){
			$time_start = microtime(true);
			$namapengarang = strtolower($pengarang);
			$namapembimbing = strtolower($pembimbing);
			$upload = new Zend_File_Transfer_Adapter_Http();
			$upload->addValidator('Extension', false, array('pdf','case'=>true))
				   ->addValidator('Size', false, array('max' => '10000kB'));

			if($_FILES['file']['name']!==''){
				if ($upload->isValid()){
					$datapengarang = $pDokumen->fetchAll($pDokumen->select()->where("NamaPengarang='$namapengarang'"));
					if (count($datapengarang)==0){
						$rowpengarang  = $pDokumen->createRow();
						$rowpengarang->NamaPengarang = $pengarang;
						$IDpengarang = $rowpengarang->save();
					}else{
						$IDpengarang =  $datapengarang[0]['ID'];
					}
					
					$rowdoc  = $dokumen->createRow();
					$rowdoc->judul 				= $judul;
					//$rowdoc->DokumenPengarangID = $IDpengarang;
					$rowdoc->penerbit 			= $penerbit;
					$rowdoc->tahun 				= $tahun;
					$rowdoc->tipe 				= "skripsi";

					$filepdf = md5(date('YmdHis'));
					$filepath = PDFDIR."/".$filepdf;
					$upload->addFilter('Rename', $filepath);
					$upload->receive();

					$rowdoc->file = $filepdf;
					$rowdoc->filename = $_FILES['file']['name'];
					$content = $this->_helper->Tesis->pdf2txt($filepdf);
					$rowdoc->teks = $content;
					$SelectDocId = $rowdoc->save();

					$rowdocp  = $dokumenpengarang->createRow();
					$rowdocp->DokumenID   = $SelectDocId;
					$rowdocp->PengarangID = $IDpengarang;
					$rowdocp->urutan = 1;
					$rowdocp->save();

					$datapembimbing = $pDokumen->fetchAll($pDokumen->select()->where("NamaPengarang='$namapembimbing'"));
					if (count($datapembimbing)==0){
						$rowpengarang  = $pDokumen->createRow();
						$rowpengarang->NamaPengarang = $pembimbing;
						$IDpembimbing = $rowpengarang->save();
					}
					else{
						$IDpembimbing =  $datapembimbing[0]['ID'];
					}


					// $rowdocp  = $dokumenpengarang->createRow();
					// $rowdocp->DokumenID   = $SelectDocId;
					// $rowdocp->PengarangID = $IDpembimbing;
					// $rowdocp->urutan = 2;
					// $rowdocp->save();

					$rowskripsi  = $skripsi->createRow();
					$rowskripsi->ID = $SelectDocId;
					$rowskripsi->PembimbingID = $IDpembimbing;
					$rowskripsi->NRP = $nrp;
					$rowskripsi->save();
					if($content){
						$citation = $this->_helper->Tesis->citation_parser($filepdf);
					}else{
						$citation = "";
					}
					// print_r($citation);
					// echo is_array($citation);
					if (is_array($citation)){
						foreach ($citation as $key=>$val){
							if (!trim($val)){
								continue;
							}
							// preg_match("|<type>(.*)</type>|U", $val, $out);
							// $entri_daftar_pustaka = strip_tags(str_replace($out[0],"",$val));
							$str = "<citation>".str_replace("&","&amp;",$val)."</citation>";
							// error_log($str);
							$cit = simplexml_load_string($str);
							$tipe = $cit->type[0];
							$entri_daftar_pustaka = $cit->raw[0];
							$waktu_eksekusi = $cit->runtime[0];
							$templates = $cit->match[0];
							$new = $failed->createRow();
							$new->nrp = $nrp;
							$new->entri_daftar_pustaka = $entri_daftar_pustaka;
							if($tipe=="reject"){
								if($entri_daftar_pustaka){
									$new->save();
								}
								continue;
							}
							$pengarang = $this->_helper->Tesis->parse_author($cit->authors[0]);
							$tahun = $cit->year[0];
							$judul = trim($cit->title[0]);
							if($tipe=="website" && !$judul){
								$judul = isset($cit->url)?$cit->url[0]:"";
								$judul = preg_replace("/\[.*$/","",$judul);
								$judul = preg_replace("/[\.\,\)\(\;]+$/","",$judul);
							}
							if(!$judul){
								if($entri_daftar_pustaka){
									$new->save();
								}
								continue;
							}
							unset($new);
							$checkdoc = $this->_helper->Tesis->checkdoc($pengarang,$judul,$tahun);
							if(count($checkdoc)){
								if(count($checkdoc)==1){
									$simdoc = $checkdoc[0];
								}else{
									$simdoc = $checkdoc[0];
									for ($i=1;$i<count($checkdoc);$i++){
										if($simdoc["jarak_levenstein"]>$checkdoc[$i]["jarak_levenstein"]){
											$simdoc=$checkdoc[$i];
										}
									}
								}
								$rowpustaka = $pustaka->createRow();
								$rowpustaka->DokumenSumberID = $SelectDocId;
								$rowpustaka->DokumenID = $simdoc["ID"];
								$rowpustaka->entri_daftar_pustaka = $entri_daftar_pustaka;
								$rowpustaka->save();
								continue;
							}
							if(isset($cit->publication)){
								$penerbit = $cit->publication[0];
							}elseif(isset($cit->publisher)){
								$penerbit = $cit->publisher[0];
							}else{
								$penerbit="";
							}
							$rowdoc  = $dokumen->createRow();
							$rowdoc->judul 				= $judul;
							$rowdoc->penerbit 			= $penerbit;
							$rowdoc->tahun 				= $tahun;
							$rowdoc->tipe 				= $tipe;
							$DokumenID = $rowdoc->save();
							$i=1;
							foreach ($pengarang as $key1=>$val1){
								if(!trim($val1)){
									continue;
								}
								$val1 = $this->_helper->Tesis->formatNamaPengarang($val1);

								$datapengarang = $pDokumen->fetchAll($pDokumen->select()->where("NamaPengarang='".addslashes($val1)."'"));
								if (count($datapengarang)==0){
									$rowpengarang  = $pDokumen->createRow();
									$rowpengarang->NamaPengarang = $val1;
									$IDpengarang = $rowpengarang->save();
								}else{
									$IDpengarang =  $datapengarang[0]['ID'];
								}
								$rowdocp  = $dokumenpengarang->createRow();
								$rowdocp->DokumenID   = $DokumenID;
								$rowdocp->PengarangID = $IDpengarang;
								$rowdocp->urutan = $i;
								$rowdocp->save();
								$i++;
							}
							$rowpustaka = $pustaka->createRow();
							$rowpustaka->DokumenSumberID = $SelectDocId;
							$rowpustaka->DokumenID = $DokumenID;
							$rowpustaka->entri_daftar_pustaka = $entri_daftar_pustaka;
							$rowpustaka->save();
							$sql ="";
							$penerbit = addslashes($penerbit);
							if($tipe=="website"){
								$url = isset($cit->url)?$cit->url:"";
								$url = preg_replace("/\[.*$/","",$url);
								$url = preg_replace("/[\.\,\)\(\;]+$/","",$url);
								$sql = "INSERT INTO Website (ID,url) values ('$DokumenID','$url')";
							}elseif($tipe=="jurnal"){
								$volume = isset($cit->volume)?addslashes($cit->volume):"";
								$issue = isset($cit->issue)?addslashes($cit->issue):"";
								$pages = isset($cit->pages)?addslashes($cit->pages):"";
								$sql = "INSERT INTO Jurnal (ID,nama_jurnal,volume,issue,halaman) values ('$DokumenID','$penerbit','$volume', '$issue', '$pages')";
							}elseif($tipe=="prosiding"){
								$publoc = isset($cit->publoc)?addslashes($cit->publoc):"";
								$sql = "INSERT INTO Prosiding (ID,nama_prosiding,lokasi) values ('$DokumenID','$penerbit','$publoc')";
							}
							if($sql){
								$db->query($sql);
							}
						}
					}
					$time_end = microtime(true);
					$waktu_eksekusi = $time_end - $time_start;
					$data['waktu_eksekusi'] = $waktu_eksekusi;
					$where = $dokumen->getAdapter()->quoteInto('ID= ?', $SelectDocId);
					$dokumen->update($data, $where);
					
					$result["success"] = "true";
				}else{
					$result["success"] = "false";
					$result["reason"] = "Tipe file yang boleh diupload hanya .pdf !!!";
				}
			}else{
				$result["success"] = "false";
				$result["reason"] = "Silakan pilih file.. !!!";
			}
		}
		
		echo Zend_Json::encode($result);
	}
	function editAction()
	{
		$this->_helper->layout()->disableLayout();
		$this->_helper->viewRenderer->setNoRender();
		
		extract($this->getRequest()->getParams());

		$p = strtolower($pengarangDoc);
		$dokumen = new Dokumen();
		$skripsi = new Skripsi();
		$pustaka = new Pustaka();
		$pengarang = $this->_helper->Tesis->formatNamaPengarang($pengarang);
		$pembimbing =$this->_helper->Tesis->formatNamaPengarang($pembimbing);
		$authors = array($pengarang,$pembimbing);
		$dokumenpengarang = new Dokumenpengarang();
		$pDokumen = new Pengarang();
		$doc = $dokumen->FetchRow("ID='$ID'");

		if($_FILES['file']['name']!==''){
			$upload = new Zend_File_Transfer_Adapter_Http();
			$upload->addValidator('Extension', false, array('pdf','case'=>true))
				   ->addValidator('Size', false, array('max' => '10000kB'));
			$filepdf = md5(date('YmdHis'));
			$filepath = PDFDIR."/".$filepdf;
			$upload->addFilter('Rename', $filepath);
			$upload->receive();

			$data['file'] = $filepdf;
			$data['filename'] = $_FILES['file']['name'];
			$content = $this->_helper->Tesis->pdf2txt($filepdf);
			$data['teks'] = $content;

			$wherepustaka = $pustaka->getAdapter()->quoteInto('DokumenSumberID= ?', $ID);
			$pustaka->delete($wherepustaka);

			$citation = $this->_helper->Tesis->citation_parser($filepdf);
			if (is_array($citation)){
				foreach ($citation as $key=>$val){
					if (!trim($val)){
						continue;
					}
					preg_match("|<type>(.*)</type>|U", $val, $out);
					$entri_daftar_pustaka = strip_tags(str_replace($out[0],"",$val));
					$str = "<citation>".str_replace("&","&amp;",$val)."</citation>";
					error_log($str);
					$cit = simplexml_load_string($str);
					$tipe = $cit->type[0];
					$pengarang = $this->_helper->Tesis->parse_author($cit->authors[0]);
					$tahun = $cit->year[0];
					$judul = trim($cit->title[0],"\x00..\x40");
					if(!$judul){
						continue;
					}
					$checkdoc = $this->_helper->Tesis->checkdoc($pengarang,$judul,$tahun);
					if(count($checkdoc)){
						if(count($checkdoc)==1){
							$simdoc = $checkdoc[0];
						}else{
							$simdoc = $checkdoc[0];
							for ($i=1;$i<count($checkdoc);$i++){
								if($simdoc["jarak_levenstein"]>$checkdoc[$i]["jarak_levenstein"]){
									$simdoc=$checkdoc[$i];
								}
							}
						}
						$rowpustaka = $pustaka->createRow();
						$rowpustaka->DokumenSumberID = $SelectDocId;
						$rowpustaka->DokumenID = $simdoc["ID"];
						$rowpustaka->entri_daftar_pustaka = $entri_daftar_pustaka;
						$rowpustaka->save();
						continue;
					}
					$penerbit = isset($cit->publisher)?$cit->publisher[0]:"";
					$rowdoc  = $dokumen->createRow();
					$rowdoc->judul 				= $judul;
					$rowdoc->penerbit 			= $penerbit;
					$rowdoc->tahun 				= $tahun;
					$rowdoc->tipe 				= $tipe;
					$DokumenID = $rowdoc->save();
					$i=1;
					foreach ($pengarang as $key1=>$val1){
						if(!trim($val1)){
							continue;
						}
						$val1 = $this->_helper->Tesis->formatNamaPengarang($val1);
						$datapengarang = $pDokumen->fetchAll($pDokumen->select()->where("NamaPengarang='$val1'"));
						if (count($datapengarang)==0){
							$rowpengarang  = $pDokumen->createRow();
							$rowpengarang->NamaPengarang = $val1;
							$IDpengarang = $rowpengarang->save();
						}else{
							$IDpengarang =  $datapengarang[0]['ID'];
						}
						$rowdocp  = $dokumenpengarang->createRow();
						$rowdocp->DokumenID   = $DokumenID;
						$rowdocp->PengarangID = $IDpengarang;
						$rowdocp->urutan = $i;
						$rowdocp->save();
						$i++;
					}
					$rowpustaka = $pustaka->createRow();
					$rowpustaka->DokumenSumberID = $ID;
					$rowpustaka->DokumenID = $DokumenID;
					$rowpustaka->entri_daftar_pustaka = $entri_daftar_pustaka;
					$rowpustaka->save();
					$sql ="";
					if($tipe=="website"){
						$url = isset($cit->url)?$cit->url:"";
						$sql = "INSERT INTO Website (ID,url) values ('$DokumenID','$url')";
					}elseif($tipe=="jurnal"){
						$volume = isset($cit->volume)?$cit->volume:"";
						$sql = "INSERT INTO Jurnal (ID,nama_jurnal,volume) values ('$DokumenID','$penerbit','$volume')";
					}elseif($tipe=="prosiding"){
						$publoc = isset($cit->publoc)?$cit->publoc:"";
						$sql = "INSERT INTO Prosiding (ID,nama_prosiding,lokasi) values ('$DokumenID','$penerbit','$publoc')";
					}
					if($sql){
						$db->query($sql);
					}
				}
			}
		}
		$namapengarang = strtolower($pengarang);
		$namapembimbing = strtolower($pembimbing);

		$data['judul'] 				= $judul;
		$data['penerbit'] 			= $penerbit;
		$data['tahun'] 				= $tahun;
		$data['tipe'] 				= "skripsi";
		$where = $dokumen->getAdapter()->quoteInto('ID= ?', $ID);
		$dokumen->update($data, $where);

		$datapengarang = $pDokumen->fetchAll($pDokumen->select()->where("NamaPengarang='$namapengarang'"));
		if (count($datapengarang)==0){
			$rowpengarang  = $pDokumen->createRow();
			$rowpengarang->NamaPengarang = $pengarang;
			$IDpengarang = $rowpengarang->save();
		}else{
			$IDpengarang =  $datapengarang[0]['ID'];
		}

		$datapembimbing = $pDokumen->fetchAll($pDokumen->select()->where("NamaPengarang='$namapembimbing'"));
		if (count($datapembimbing)==0){
			$rowpengarang  = $pDokumen->createRow();
			$rowpengarang->NamaPengarang = $pembimbing;
			$IDpembimbing = $rowpengarang->save();
		}else{
			$IDpembimbing =  $datapembimbing[0]['ID'];
		}

		$wheredp = $dokumenpengarang->getAdapter()->quoteInto('DokumenID= ?', $ID);
		$dokumenpengarang->delete($wheredp);

		$rowdocp  = $dokumenpengarang->createRow();
		$rowdocp->DokumenID   = $ID;
		$rowdocp->PengarangID = $IDpengarang;
		$rowdocp->urutan = 1;
		$rowdocp->save();

		$rowdocp  = $dokumenpengarang->createRow();
		$rowdocp->DokumenID   = $ID;
		$rowdocp->PengarangID = $IDpembimbing;
		$rowdocp->urutan = 2;
		$rowdocp->save();

		$dataskripsi['NRP'] = $nrp;
		$dataskripsi['PembimbingID'] = $PembimbingID;
		$skripsi->update($dataskripsi, $where);

		$result["success"] = "true";

		echo json_encode($result);
	}
	public function deleteAction()
	{
		$this->_helper->layout()->disableLayout();
		$this->_helper->viewRenderer->setNoRender();
		
		$dokumen = new Dokumen();
		$dokumenpengarang = new Dokumenpengarang();
		$pDokumen = new Pengarang();
		$skripsi = new Skripsi();

		$ID =$this->getRequest()->getParam("ID");

		$target=realpath(APPLICATION_PATH."/../htdocs/".$filepath);
		@unlink($target);

		$where = $skripsi->getAdapter()->quoteInto('ID= ?', $ID);
		$skripsi->delete($where);

		$where = $dokumenpengarang->getAdapter()->quoteInto('DokumenID= ?', $ID);
		$dokumenpengarang->delete($where);

		$where = $pDokumen->getAdapter()->quoteInto('ID= ?', $DokumenPengarangID);
		$pDokumen->delete($where);

		$where = $dokumen->getAdapter()->quoteInto('ID= ?', $ID);
		$dokumen->delete($where);

		$result["success"] = "true";
		echo json_encode($result);
	}

	public function pdfAction(){
		$this->_helper->layout()->disableLayout();
		$this->_helper->viewRenderer->setNoRender();
		$dokumen = new Dokumen();
		$ID = $this->getRequest()->getParam("id");
		$doc = $dokumen->fetchRow("ID='$ID'");
		$filepath = PDFDIR."/".$doc->file;
        $mime = mime_content_type($filepath);
        $content = file_get_contents($filepath);
        header("Content-type: $mime");
        echo $content;
        exit;        
	}
	public function testremovetitelAction(){
		$nama = "Rijsbergen CJ van";
		echo $this->_helper->Tesis->formatNamaPengarang($nama);exit;
	}

	public function testparseauthorAction(){
		$nama = "Barnesley MF, Devaney RL, Mandelbrot, Peitgen HO, Saupe D, et al";
		// $nama = "Herryadie, Ferru Deciyanto";
		// if(preg_match('/(\w+),\s*(\w+)/',$nama)){
		// 	$nama = preg_replace('/(\w+),\s*(\w+)/', '$2 $1', $nama);
		// }
		print_r($this->_helper->Tesis->parse_author($nama));exit;
	}
	
	public function testpregreplaceAction(){
		$str = "asdasda.csd[ads asd asdasda]";
		print_r(preg_replace("/\[.*/", "", $str));exit;
	}

	public function gentemplateAction(){
		$templatesfile = realpath(APPLICATION_PATH."/../perl/")."/Biblio/Citation/Parser/Templates.pm";
		$templates= array(
			"skripsi"=>array(
				array(
					array(
						"_AUTHORS_. _YEAR_.",
						"_AUTHORS_.",
					),
					array(
						"_TITLE_ [skripsi].",
						"_TITLE_ [tesis].",
						"_TITLE_ [disertasi].",
					),
					array(
						"",
						"_ANY_.",
					),
					array(
						"_PUBLISHER_.",
						"_PUBLOC_: _PUBLISHER_.",
						"_PUBLOC_: _PUBLISHER_, _ANY_.",
						"_PUBLOC_: _PUBLISHER_. _ANY_.",
						"_PUBLISHER_. _PUBLOC_.",
					),
				),
				array(
					array(
						"_AUTHORS_. _YEAR_.",
						"_AUTHORS_.",
					),
					array(
						"_TITLE_.",
					),
					array(
						"",
						"_PUBLISHER_",
						"_PUBLOC_: _PUBLISHER_",
						"_PUBLOC_: _PUBLISHER_, _ANY_",
						"_PUBLOC_: _PUBLISHER_. _ANY_",
						"_PUBLISHER_. _PUBLOC_",
					),
					array(
						"[skripsi].",
						"[tesis].",
						"[disertasi]."
					),
				),
				array(
					array(
						"_AUTHORS_. _YEAR_.",
						"_AUTHORS_.",
					),
					array(
						"_TITLE_",
					),
					array(
						"[skripsi].",
						"[tesis].",
						"[disertasi]."
					),
				),
			),
			"website"=>array(
				array(
					array(
						"_AUTHORS_. _YEAR_.",
						"_AUTHORS_.",
					),
					array(
						"_TITLE_.",
						"_TITLE_ [Internet].",
						"_TITLE_. [diunduh _ANY_].",
						"_TITLE_ [Internet]. [diunduh _ANY_].",
					),
					array(
						"",
						"_PUBLISHER_",
						"_PUBLISHER_.",
						"_PUBLISHER_:",
						"_PUBLOC_: _PUBLISHER_.",
						"_PUBLOC_: _PUBLISHER_, _ANY_",
						"_PUBLOC_: _PUBLISHER_. _ANY_",
						"_PUBLISHER_. _PUBLOC_.",
						"_PUBLISHER_. _PUBLOC_: _ANY_",
						"Di dalam: _PUBLISHER_:",
						"Di dalam: _PUBLISHER_;",
						"Di dalam: _PUBLISHER_: _PUBLOC_,",
						"Di dalam: _PUBLISHER_; _PUBLOC_,",
						"Di dalam: _PUBLISHER_: _PUBLOC_, _ANY_",
						"Di dalam: _PUBLISHER_; _PUBLOC_, _ANY_",
					),
					array(
						"",
						"_VOLUME_(_ISSUE_):_PAGES_.",
						"_VOLUME_(_ISSUE_). _PAGES_.",
						"_VOLUME_(_ISSUE_), _PAGES_.",
						"_VOLUME_(_ISSUE_): hlm. _PAGES_.",
						"_VOLUME_(_ISSUE_). hlm. _PAGES_.",
						"_VOLUME_(_ISSUE_), hlm. _PAGES_.",
						"_VOLUME_(_ISSUE_).",
						"_VOLUME_: _PAGES_.",
						"_VOLUME_: hlm. _PAGES_.",
						// "_VOLUME_.",
						// "_PAGES_.",
						"vol. _VOLUME_(_ISSUE_):_PAGES_.",
						"vol. _VOLUME_ no. _ISSUE_ hlm. _PAGES_.",
						"vol. _VOLUME_, no. _ISSUE_, hlm. _PAGES_.",
						"vol. _VOLUME_. no. _ISSUE_. hlm. _PAGES_.",
						"vol. _VOLUME_. no. _ISSUE_: hlm. _PAGES_.",
						"vol. _VOLUME_ no. _ISSUE_.",
						"vol. _VOLUME_, no. _ISSUE_.",
						"vol. _VOLUME_. no. _ISSUE_.",
						"vol. _VOLUME_ hlm. _PAGES_.",
						"vol. _VOLUME_, hlm. _PAGES_.",
						"vol. _VOLUME_. hlm. _PAGES_.",
						"vol. _VOLUME_: hlm. _PAGES_.",
						"vol. _VOLUME_.",
						"hlm. _PAGES_.",
					),
					array(
						// "",
						"_URL_.",
						"_URL_[_ANY_].",
						"_URL_ [_ANY_].",
						"_URL_. [_ANY_].",
						"Tersedia pada: _URL_.",
						"Tersedia pada: _URL_ [_ANY_].",
						"Tersedia pada: _URL_[_ANY_].",
						"Tersedia pada: _URL_. [_ANY_].",
						"Retrieved _ANY_ from _URL_.",
						"Retrieved _ANY_ from _URL_[_ANY_].",
						"Retrieved _ANY_ from _URL_ [_ANY_].",
						"Retrieved _ANY_ from _URL_. [_ANY_].",
						"_URL_ Accessed _ANY_.",
					)
				),
				array(
					array(
						"_AUTHORS_.",
						"_AUTHORS_. _YEAR_.",
						"_AUTHORS_. _YEAR_. _TITLE_ ",
						"_AUTHORS_. _TITLE_ "
					),
					array(
						"_URL_.",
						"_URL_[_ANY_].",
						"_URL_ [_ANY_].",
						"_URL_. [_ANY_].",
					)
				)
			),
			"prosiding"=>array(
				array(
					array(
						"_AUTHORS_. _YEAR_.",
						"_AUTHORS_.",
					),
					array(
						"_TITLE_.",
						"_TITLE_. Di dalam: _EDITOR_, editor."
						// "_TITLE_. _SUBTITLE_.",
					),
					array(
						"_PUBLICATION_",
						"_PUBLICATION_.",
						"_PUBLICATION_:",

						"_PUBLOC_: _PUBLICATION_. ",
						"_PUBLOC_: _PUBLICATION_. _PUBLISHER_.",
						
						"_PUBLICATION_, _PUBLOC_.",
						"_PUBLICATION_. _PUBLOC_.",
						
						"_PUBLICATION_. _PUBLOC_: _PUBLISHER_.",
						"_PUBLICATION_. _ANY_. _PUBLOC_: _PUBLISHER_.",
						"_PUBLICATION_. _ANY_. _PUBLOC_: _PUBLISHER_",
						"_PUBLICATION_, _PUBLOC_. _PUBLISHER_.",

						"Di dalam: _PUBLICATION_",
						"Di dalam: _PUBLICATION_.",
						"Di dalam: _PUBLICATION_:",
						"Di dalam: _PUBLICATION_;",

						// "Di dalam: _PUBLICATION_: _PUBLOC_,",
						"Di dalam: _PUBLICATION_; _PUBLOC_,",

						// "Di dalam: _PUBLICATION_: _PUBLOC_, _ANY_",
						"Di dalam: _PUBLICATION_; _PUBLOC_, _ANY_",

						"Di dalam: _PUBLICATION_, _ANY_",
						"Di dalam: _PUBLICATION_, _ANY_. _PUBLOC_",

					),
					array(
						"",
						"_VOLUME_(_ISSUE_):_PAGES_.",
						"_VOLUME_(_ISSUE_). _PAGES_.",
						"_VOLUME_(_ISSUE_), _PAGES_.",
						"_VOLUME_(_ISSUE_): hlm. _PAGES_.",
						"_VOLUME_(_ISSUE_). hlm. _PAGES_.",
						"_VOLUME_(_ISSUE_), hlm. _PAGES_.",
						"_VOLUME_(_ISSUE_).",
						"_VOLUME_: _PAGES_.",
						"_VOLUME_: hlm. _PAGES_.",
						// "_VOLUME_.",
						"vol. _VOLUME_(_ISSUE_):_PAGES_.",
						"vol. _VOLUME_ no. _ISSUE_ hlm. _PAGES_.",
						"vol. _VOLUME_, no. _ISSUE_, hlm. _PAGES_.",
						"vol. _VOLUME_. no. _ISSUE_. hlm. _PAGES_.",
						"vol. _VOLUME_. no. _ISSUE_: hlm. _PAGES_.",
						"vol. _VOLUME_ no. _ISSUE_.",
						"vol. _VOLUME_, no. _ISSUE_.",
						"vol. _VOLUME_. no. _ISSUE_.",
						"vol. _VOLUME_ hlm. _PAGES_.",
						"vol. _VOLUME_, hlm. _PAGES_.",
						"vol. _VOLUME_. hlm. _PAGES_.",
						"vol. _VOLUME_: hlm. _PAGES_.",
						"vol. _VOLUME_.",
						"vol. _VOLUME_. _ANY_.",
						"hlm. _PAGES_.",
					)
				)
			),
			"jurnal"=>array(
				array(
					array(
						"_AUTHORS_. _YEAR_.",
						"_AUTHORS_.",
					),
					array(
						"_TITLE_.",
						"_TITLE_,",
						// "_TITLE_. _SUBTITLE_.",
					),
					array(
						// "",
						"_PUBLISHER_",
						"_PUBLISHER_.",
						"_PUBLISHER_:",
						"_PUBLOC_: _PUBLISHER_.",
						"_PUBLISHER_. _PUBLOC_.",
						"Di dalam: _PUBLISHER_",
						"Di dalam: _PUBLISHER_:",
						"Di dalam: _PUBLISHER_;",
						"Di dalam: _PUBLISHER_.",
						"Di dalam: _PUBLISHER_: _PUBLOC_,",
						"Di dalam: _PUBLISHER_; _PUBLOC_,",
						"Di dalam: _PUBLISHER_: _PUBLOC_, _ANY_",
						"Di dalam: _PUBLISHER_; _PUBLOC_, _ANY_",
					),
					array(
						"_VOLUME_(_ISSUE_):_PAGES_.",
						"_VOLUME_(_ISSUE_). _PAGES_.",
						"_VOLUME_(_ISSUE_), _PAGES_.",
						"_VOLUME_(_ISSUE_): hlm. _PAGES_.",
						"_VOLUME_(_ISSUE_). hlm. _PAGES_.",
						"_VOLUME_(_ISSUE_), hlm. _PAGES_.",
						"_VOLUME_(_ISSUE_).",
						"_VOLUME_: _PAGES_.",
						"_VOLUME_: _PAGES_, _ANY_.",
						"_VOLUME_: _ISSUE_ hlm. _PAGES_.",
						"_VOLUME_: hlm. _PAGES_.",
						"vol. _VOLUME_: hlm. _PAGES_.",
						"vol. _VOLUME_(_ISSUE_):_PAGES_.",
						"vol. _VOLUME_ no. _ISSUE_ hlm. _PAGES_.",
						"vol. _VOLUME_ no. _ISSUE_, hlm. _PAGES_.",
						"vol. _VOLUME_, no. _ISSUE_, hlm. _PAGES_.",
						"vol. _VOLUME_, no. _ISSUE_, _ANY_, hlm. _PAGES_.",
						"vol. _VOLUME_, no. _ISSUE_, hlm. _PAGES_,",
						"vol. _VOLUME_. no. _ISSUE_. hlm. _PAGES_.",
						"vol. _VOLUME_. no. _ISSUE_: hlm. _PAGES_.",
						"vol. _VOLUME_, no. _ISSUE_, _ANY_. hlm. _PAGES_.",
						"vol. _VOLUME_ no. _ISSUE_.",
						"vol. _VOLUME_, no. _ISSUE_.",
						"vol. _VOLUME_. no. _ISSUE_.",
						"vol. _VOLUME_ hlm. _PAGES_.",
						"vol. _VOLUME_, hlm. _PAGES_.",
						"vol. _VOLUME_. hlm. _PAGES_.",
						"vol. _VOLUME_, _ANY_ hlm. _PAGES_.",
						"vol. _VOLUME_: hlm. _PAGES_.",
						"vol. _VOLUME_.",

						"no. _ISSUE_, _ANY_ hlm. _PAGES_."
					),
					array(
						"",
						"_PUBLOC_."
					)
				),
				array(
					array(
						"_AUTHORS_. _YEAR_. _TITLE_. Di dalam: _ANY_ no. _ISSUE_, _PUBLISHER_."
					)
				)
			),
			"buku"=>array(
				array(
					array(
						"_AUTHORS_. _YEAR_.",
						"_AUTHORS_.",
					),
					array(
						"_TITLE_.",
						"_TITLE_. _EDISI_.",
						"_TITLE_. Di dalam: _EDITOR_, editor.",
						"_TITLE_. Di dalam: _EDITOR_, editor. _EDITORTITLE_.",
						"_TITLE_. Di dalam: _EDITOR_, editor. _EDITORTITLE_. _EDISI_.",
						"_TITLE_. _EDISI_. Di dalam: _EDITOR_, editor. _EDITORTITLE_.",
					),
					array(
						"",
						"_PUBLISHER_",
						"_PUBLISHER_.",
						"_PUBLISHER_:",
						"_PUBLOC_: _PUBLISHER_.",
						"_PUBLISHER_. _PUBLOC_.",

						"ISBN _ISBN_.",
						"ISBN _ISBN_: _PUBLISHER_.",
						"_PUBLISHER_, ISBN _ISBN_.",
						"_PUBLISHER_. ISBN _ISBN_.",
					),
					array(
						"",
						"_PAGES_.",
						"hlm. _PAGES_.",
					),
				),
				array(
					array(
						"_AUTHORS_. _YEAR_.",
						"_AUTHORS_.",
					),
					array(
						"_TITLE_. _EDITOR_, penerjemah.",
						"_TITLE_. _EDITOR_, penerjemah. _EDISI_.",
						"_TITLE_. _EDISI_._EDITOR_, penerjemah.",
						"_TITLE_. _EDITOR_, penerjemah. _ANY_",
					),
					array(
						"",
						"_PUBLISHER_.",
						"_PUBLISHER_:",
						"_PUBLOC_: _PUBLISHER_.",
						"_PUBLOC_: _PUBLISHER_. _ANY_.",
						"_PUBLISHER_. _PUBLOC_.",
						
					),
					array(
						"",
						"_PAGES_.",
						"hlm. _PAGES_.",
					),
					array(
						"Terjemahan dari: _EDITORTITLE_.",
					)
				)
			),
		);
		$entry = "";
		foreach($templates as $key1=>$arr1){
			$tipe = $key1;
			$entry .= "#".$tipe."\n";
			foreach($arr1 as $key2=>$arr2){
				$arr = array();
				foreach($arr2 as $key3=>$arr3){
					$arr = $this->combinerecursive($arr,$arr3);
				}
				foreach($arr as $key=>$val){
					if(preg_match("/.+\.$|#\?#$/", trim($val))){
						$entry .="'".$tipe."=>".preg_replace("/  +/", " ", trim($val)."',\n");
					}					
				}
			}
			$entry.= "\n";
		}
		$content = file_get_contents($templatesfile);
		$content = preg_replace("/##<replace>##\n([.\s\S]+)\n##<\/replace>##\n/", "##<replace>##\n$entry##</replace>##\n", $content);
		file_put_contents($templatesfile, $content);
		echo $entry;
		exit;
	}
	private function combinerecursive($arr1, $arr2){
		if(!count($arr1) && count($arr2)){
			return $arr2;
		}else if(count($arr1) && !count($arr2)){
			return $arr1;
		}else if(!count($arr1) && !count($arr2)){
			return array();
		}

		foreach($arr1 as $key1=>$val1){
			foreach($arr2 as $key2=>$val2){
				$arr[] = $val1." ".$val2;
			}
		}
		return $arr;
	}
}

?>