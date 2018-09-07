<?php 
class TestController extends Zend_Controller_Action
{
	public function buildmetaAction(){
		$this->_helper->layout()->disableLayout();
		$this->_helper->viewRenderer->setNoRender();
		$metadata = new TestMetadataReal;
		$dataskripsi = TMPDIR."/dataskripsi.txt";
		// $this->_helper->Tesis->emptydirectory(TMPDIR."/txt/");
		$fp = fopen($dataskripsi,"r");
		$row=0;
		$dr=0;
		while (($data = fgetcsv($fp, 0, "\t")) !== FALSE) {
			if($row==0){
				foreach($data as $key=> $col){
					$header[$key] = $col; 
				}
			}else{
				foreach($data as $key=>$col){
					$csv[$dr][$header[$key]] = $col; 
				}
				$dr++;				
			}
			$row++;
		}
		fclose($fp);
		echo "<pre>";
		foreach($csv as $key=>$row){
			$this->pdf2txt($row["filepdf"],trim($row["nrp"]));
			$output = $this->citation_parser(trim($row["nrp"]));
			$new = $metadata->createRow();
			$nrp = trim($row["nrp"]);
			$where = $metadata->getAdapter()->quoteInto('nrp= ?', $nrp);
			$metadata->delete($where);
			$entri = json_encode($output);
			$total_entri = count($output);
			$judul = trim($row["judul"]);
			$tahun = trim($row["tahun"]);
			$pembimbing = trim($row["pembimbing"]);
			$new->nrp = $nrp;
			$new->entri = $entri;
			$new->total_entri = $total_entri;
			$new->judul = $judul;
			$new->pembimbing = $pembimbing;
			$new->tahun = $tahun;
			$new->save();
			print_r(array(trim($row["nrp"])=>array("entri"=>$output,"total_entri"=>$total_entri)));
			echo "\n\n";
		}
		echo "</pre>";
	}
	private function pdf2txt($filepdf,$nrp){
		$filetxt = TMPDIR."/txt/".$nrp;
		$strexec = PDFTOTEXT." -enc ASCII7 -raw \"".$filepdf."\" ".$filetxt;
		// echo $strexec;exit;
		exec($strexec);
		$content = "";
		$strexec = PDFTOTEXT." -enc ASCII7 -layout \"".$filepdf."\" ".$filetxt."~layout";
		exec($strexec);
		// if (file_exists($filetxt)){
		// 	$content = file_get_contents($filetxt);
		// }
		// return $content;
	}
	private function citation_parser($nrp){
		$filetxt = TMPDIR."/txt/".$nrp;
		$strexec = DOCPARSERTEST." ".$filetxt;
		//echo $strexec;exit;
		exec($strexec,$output);
		return $output;
	}

	public function importdocAction(){
		set_time_limit(0);
		$this->_helper->layout()->disableLayout();
		$this->_helper->viewRenderer->setNoRender();
		$db = Zend_Db_Table_Abstract::getDefaultAdapter();

		$dokumen = new Dokumen();
		$skripsi = new Skripsi();
		$dokumenpengarang = new Dokumenpengarang();	
		$pDokumen = new Pengarang();
		$pustaka = new Pustaka();
		$failed = new TestMetadataFailed;

		$dataskripsi = TMPDIR."/dataskripsi.txt";
		$this->_helper->Tesis->emptydirectory(PDFDIR);
		$this->_helper->Tesis->emptydirectory(TXTDIR);
		$emptySQL = "TRUNCATE `Dokumen`;
					TRUNCATE `DokumenPengarang`;
					TRUNCATE `Jurnal`;
					TRUNCATE `Pengarang`;
					TRUNCATE `Prosiding`;
					TRUNCATE `Pustaka`;
					TRUNCATE `Skripsi`;
					TRUNCATE `Website`;
					TRUNCATE `__test__MetadataFailed`;";
		$db->query($emptySQL);
		$fp = fopen($dataskripsi,"r");
		$row=0;
		$dr=0;
		while (($data = fgetcsv($fp, 0, "\t")) !== FALSE) {
			if($row==0){
				foreach($data as $key=> $col){
					$header[$key] = $col; 
				}
			}else{
				foreach($data as $key=>$col){
					$csv[$dr][$header[$key]] = $col; 
				}
				$dr++;				
			}
			$row++;
		}
		fclose($fp);

		foreach($csv as $key=>$row){
			error_log($row["nrp"]);
			$pengarang = $this->_helper->Tesis->formatNamaPengarang($row['nama_mahasiswa']);
			$pembimbing = $this->_helper->Tesis->formatNamaPengarang($row['pembimbing']);
			$authors = array($pengarang,$pembimbing);
			$judul = trim($row["judul"]);
			$tahun = trim($row["tahun"]);
			$nrp = trim($row["nrp"]);
			$penerbit = trim($row["penerbit"]);
			$checkdoc = $this->_helper->Tesis->checkdoc($authors,$judul,$tahun);
			if(!count($checkdoc)){
				$time_start = microtime(true);
				$namapengarang = addslashes(strtolower($pengarang));
				$namapembimbing = addslashes(strtolower($pembimbing));
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
				copy($row['filepdf'],$filepath);

				$rowdoc->file = $filepdf;
				$rowdoc->filename = $nrp.".pdf";
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
				// }
				}else{
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

				if (is_array($citation)){
					foreach ($citation as $key=>$val){
						if (!trim($val)){
							continue;
						}
						// preg_match("|<type>(.*)</type>|U", $val, $out);
						// $entri_daftar_pustaka = strip_tags(str_replace($out[0],"",$val));
						// $entri_daftar_pustaka = str_replace("#?#", "", $entri_daftar_pustaka);
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
							$rowpustaka->templates = $templates;
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
						$penerbit = trim($penerbit);
						if($penerbit){
							$penerbit = preg_replace("/^Di dalam: /", "", $penerbit);
							$penerbit = preg_replace("/[,\.]$/", "", $penerbit);
							$penerbit = preg_replace("/^the/i", "The", $penerbit);
						}
						$penerbit = trim($penerbit);

						$rowdoc  = $dokumen->createRow();
						$rowdoc->judul 				= $judul;
						$rowdoc->penerbit 			= $penerbit;
						$rowdoc->tahun 				= $tahun;
						$rowdoc->tipe 				= $tipe;
						$rowdoc->waktu_eksekusi		= $waktu_eksekusi;
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
						$rowpustaka->templates = $templates;
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
							error_log($sql);
							$db->query($sql);
						}
					}
				}
				$time_end = microtime(true);
				$waktu_eksekusi = $time_end - $time_start;
				$data['waktu_eksekusi'] = $waktu_eksekusi;
				$where = $dokumen->getAdapter()->quoteInto('ID= ?', $SelectDocId);
				$dokumen->update($data, $where);
			}
		}
	}
	public function identifyrefAction(){
		set_time_limit(0);
		$this->_helper->layout()->disableLayout();
		$this->_helper->viewRenderer->setNoRender();
		$db = Zend_Db_Table_Abstract::getDefaultAdapter();

		$dokumen = new Dokumen();
		$skripsi = new Skripsi();
		// $dokumenpengarang = new Dokumenpengarang();	
		// $pDokumen = new Pengarang();
		$pustaka = new Pustaka();
		$prosiding = new Prosiding;
		$skripsi = new Skripsi;
		$jurnal = new Jurnal;
		$website = new Website;

		$realmetadata = TMPDIR."/realmetadata.txt";
		$fp = fopen($realmetadata,"r");
		$row=0;
		$dr=0;
		while (($data = fgetcsv($fp, 0, "\t")) !== FALSE) {
			if($row==0){
				foreach($data as $key=> $col){
					$header[$key] = $col; 
				}
			}else{
				foreach($data as $key=>$col){
					$csv[$dr][$header[$key]] = $col; 
				}
				$dr++;				
			}
			$row++;
		}
		fclose($fp);
		foreach($csv as $key=>$row){
			$metadata[$row["NRP"]][] = $row["Daftar Pustaka"];
		}

		foreach ($metadata as $key=>$val){
			$nrp = $key;
			$arr[$nrp]["realdaftarpustaka"] = $val;
			$arr[$nrp]["identifydaftarpustaka"] = array();
			$dataskripsi = $skripsi->fetchRow("NRP='".$nrp."'");
			if($dataskripsi){
				$datapustaka = $pustaka->fetchAll("DokumenSumberID='".$dataskripsi->ID."'");
				$i = 0;
				foreach($datapustaka as $row){
					$authors ="";
					$arr[$nrp]["identifydaftarpustaka"][$i]["raw"] = $row->entri_daftar_pustaka;
					$docid = $row->DokumenID;
					$authors = $this->_helper->Tesis->merge_authors($this->_helper->Tesis->get_authors($docid));
					$arr[$nrp]["identifydaftarpustaka"][$i]["kolom"]["pengarang"] = $authors;
					$datadokumen = $dokumen->fetchRow("ID='$docid'");
					$arr[$nrp]["identifydaftarpustaka"][$i]["kolom"]["judul"] = $datadokumen->judul;
					$arr[$nrp]["identifydaftarpustaka"][$i]["kolom"]["tahun"] = $datadokumen->tahun;
					$arr[$nrp]["identifydaftarpustaka"][$i]["kolom"]["penerbit"] = $datadokumen->penerbit;
					$tipe = $datadokumen->tipe;
					$arr[$nrp]["identifydaftarpustaka"][$i]["tipe"] = $datadokumen->tipe;
					if($tipe=="prosiding"){
						$kat = $prosiding->fetchRow("ID='$docid'");
						$arr[$nrp]["identifydaftarpustaka"][$i]["kolom"]["nama_prosiding"] = $kat->nama_prosiding;
						$arr[$nrp]["identifydaftarpustaka"][$i]["kolom"]["lokasi"] = $kat->lokasi;
					}elseif($tipe=="jurnal"){
						$kat = $jurnal->fetchRow("ID='$docid'");
						$arr[$nrp]["identifydaftarpustaka"][$i]["kolom"]["nama_jurnal"] = $kat->nama_jurnal;
						$arr[$nrp]["identifydaftarpustaka"][$i]["kolom"]["volume"] = $kat->volume;
						$arr[$nrp]["identifydaftarpustaka"][$i]["kolom"]["issue"] = $kat->issue;
						$arr[$nrp]["identifydaftarpustaka"][$i]["kolom"]["halaman"] = $kat->halaman;
					}elseif($tipe=="website"){
						$kat = $website->fetchRow("ID='$docid'");
						$arr[$nrp]["identifydaftarpustaka"][$i]["kolom"]["url"] = $kat->url;
					}
					unset($datadokumen,$kat);
					$i++;
				}
			}
		}
		$table = "<table>
					<tr>
						<td align='center'>NRP</td>
						<td align='center'>Real Entry</td>
						<td align='center'>Total Real Entry</td>
						<td align='center'>Identify Entry</td>
						<td align='center'>Kolom Identify Entry</td>
					</tr>";
		foreach($arr as $key=>$row){
			$table.="<tr><td>".$key."</td>";
			$table.="<td><ul>";
			foreach($row["realdaftarpustaka"] as $key1=>$val){
				$table .="<li>".$val."</li>";
			}
			$table.="</ul></td>";
			$table.="<td>&nbsp;".count($row["realdaftarpustaka"])."</td>";
			$table.="<td><ul>";
			$kolom="";
			foreach($row["identifydaftarpustaka"] as $key1=>$val){
				$table .="<li>".$val["raw"]."</li>";
				$kolom .="<li>";
				foreach($val["kolom"] as $col=>$content){
					$kolom.="&lt;$col&gt;$content&lt;/$col&gt;";
				}
				$kolom .="</li>";				
			}
			$table.="</ul></td><td><ul>$kolom</ul></tr>";
		}
		$table.="</table>";
		echo $table;
	}
	function identifycollectionAction(){
		set_time_limit(0);
		$this->_helper->layout()->disableLayout();
		$this->_helper->viewRenderer->setNoRender();
		$db = Zend_Db_Table_Abstract::getDefaultAdapter();
		$alist = array(
			"Han J",
			"Kamber M",
			"Guvenir HA",
			"Manning CD",
			"Raghavan P",
			"Schutze H",
			"Baeza-Yates R",
			"Demiroz G",
			"Ribeiro-Neto B",
			"Ridha A",
			"Pressman R",
			"Gonzales  RC",
			"Fauset L",
			"Woods RE",
			"Kusumadewi S",
			"Sommerville I",
			"Fu LM",
			"Hoede C",
			"Zhang L",
			"Vanstone S",
			"Nurdiati S",
			"Mitchell T",
			"Steinbach M",
			"Jain AK",
			"Adisantoso J",
			"lter N",
			"Romadoni D",
			"Buono A",
			"Barus B",
			"Connolly TM",
			"Kumar V",
			"Schneier B",
			"Sarle W",
			"Tan P",
			"Lapoliwa H",
			"Acharya T",
			"Ray AK",
			"Wiradisastra US",
			"Begg CE",
			"Woods  RE",
			"Do MN",
			"Munir R",
			"Prahasta E",
			"Menezes A",
			"Cox E",
			"Kantardzic M",
			"Alwi H",
			"Dardjowidjojo S",
			"Moeliono AM",
			"Rusiyamti",
			"Sukoco H",
			"Larose DT",
			"Croft WB",
		);
		foreach($alist as $key=>$val){
			$str = explode(" ", $val);
			$authorslist[] = $str[0];
		}

		$dokumen = new Dokumen();
		$skripsi = new Skripsi();
		// $dokumenpengarang = new Dokumenpengarang();	
		// $pDokumen = new Pengarang();
		$pustaka = new Pustaka();
		$prosiding = new Prosiding;
		$skripsi = new Skripsi;
		$jurnal = new Jurnal;
		$website = new Website;

		$realmetadata = TMPDIR."/realmetadata.txt";
		$fp = fopen($realmetadata,"r");
		$row=0;
		$dr=0;
		while (($data = fgetcsv($fp, 0, "\t")) !== FALSE) {
			if($row==0){
				foreach($data as $key=> $col){
					$header[$key] = $col; 
				}
			}else{
				foreach($data as $key=>$col){
					$csv[$dr][$header[$key]] = $col; 
				}
				$dr++;				
			}
			$row++;
		}
		fclose($fp);
		foreach($csv as $key=>$row){
			$metadata[$row["NRP"]][] = $row["Daftar Pustaka"];
		}
		$table = "<table>
					<tr>
						<td align='center'>Pengarang</td>
						<td align='center'>Real Entry</td>
					</tr>";
		foreach($authorslist as $key=>$author){
			$table.="<tr><td>".$author."</td>";
			$table.="<td><ul>";
			foreach($metadata as $key1=>$listentri){
				foreach($listentri as $key2=>$entri){
					if(preg_match("/\b$author\b/i", $entri)){
						$table.="<li>$entri</li>";
					}
				}
			}
			$table.="</ul></td></tr>";
		}
		$table.="</table>";
		echo $table;
	}
}
?>