package Biblio::Document::Parser::Standardtest;

######################################################################
#
# Biblio::Document::Parser::Standard;
#
######################################################################
#
#  This file is part of ParaCite Tools (http://paracite.eprints.org/developers/)
#
#  Copyright (c) 2002 University of Southampton, UK. SO17 1BJ.
#
#  ParaTools is free software; you can redistribute it and/or modify
#  it under the terms of the GNU General Public License as published by
#  the Free Software Foundation; either version 2 of the License, or
#  (at your option) any later version.
#
#  ParaTools is distributed in the hope that it will be useful,
#  but WITHOUT ANY WARRANTY; without even the implied warranty of
#  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#  GNU General Public License for more details.
#
#  You should have received a copy of the GNU General Public License
#  along with ParaTools; if not, write to the Free Software
#  Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA
#
######################################################################

require Exporter;
@ISA = ("Exporter", "Biblio::Document::Parser");

use Data::Dumper;
use Biblio::Document::Parser::Utils qw( normalise_multichars );

use 5.006;
use strict;
use warnings;
use vars qw($DEBUG);

our @EXPORT_OK = ( 'parse', 'new' );

$DEBUG = 0;
$Data::Dumper::Indent = 3;         # pretty print with array indices


=pod

=head1 NAME

B<Biblio::Document::Parser::Standard> - document parsing functionality

=head1 SYNOPSIS

  use Biblio::Document::Parser::Standard;
  use Biblio::Document::Parser::Utils;
  # First read a file into an array of lines.
  my $content = Biblio::Document::Parser::Utils::get_content("http://www.foo.com/myfile.pdf");
  my $doc_parser = new Biblio::Document::Parser::Standard();
  my @references = $doc_parser->parse($content);
  # Print a list of the extracted references.
  foreach(@references) { print "-> $_\n"; } 

=head1 DESCRIPTION

Biblio::Document::Parser::Standard provides a fairly simple implementation of
a system to extract references from documents. 

Various styles of reference are supported, including numeric and indented,
and documents with two columns are converted into single-column documents
prior to parsing. This is a very experimental module, and still contains
a few hard-coded constants that can probably be improved upon.

=head1 METHODS

=over 4

=item $parser = Biblio::Document::Parser::Standard-E<gt>new()

The new() method creates a new parser instance.

=cut

sub new
{
        my($class) = @_;
        my $self = {};
        return bless($self, $class);
}

=pod

=item @references = $parser-E<gt>parse($lines, $layout, [%options])

The parse() method takes a string as input (see the get_content()
function in Biblio::Document::Parser::Utils for a way to obtain this), and returns a list
of references in plain text suitable for passing to a CiteParser module. 

=cut

sub parse
{
	my($self, $lines, $layout, %options) = @_;
	$lines = _addpagebreaks($lines);
	$layout = _addpagebreaks($layout); 
	my @lines = split("\n", $lines);
	my @layout = split("\n", $layout);
	my($pivot, $avelen) = $self->_decolumnise(@lines); 
	
	my $in_refs = 0;
	my @ref_table = ();
	my $curr_ref = "";
	my @newlines = ();
	my $outcount = 0;
	my @chopped_lines = @lines;
	# print Dumper(@lines);exit;
	# First isolate the reference array. This ensures that we handle columns correctly.
	foreach(@lines)
	{
		$outcount++;
		chomp;
#		if (/(?:references)|(?:bibliography)|(?:\s+cited)|(?:\s+pustaka)/i)
		if (/(?:\s+pustaka)|(?:references)/i)
                {
                        last;
                }
		elsif (/\f/)
		{
			# No sign of any references yet, so pop off up to here
			for(my $i=0; $i<$outcount; $i++) { shift @chopped_lines; }
			$outcount = 0;
		}
	}
	my @arr1 = ();
	my @arr2 = ();
	my @arrout = ();
	my $indnt = "";
	if ($pivot)
	{
		my ($pivotl,$pivotr) = ($pivot-5,$pivot+5);
		foreach(@chopped_lines)
		{
			s/.*[^[:print:]]+//g;
			chomp;
			if (/\f/)
			{
				push @arrout, @arr1;
				push @arrout, @arr2;
				@arr1 = ();
				@arr2 = ();
			}
			else
			{
				if(/^(.{$pivotl,$pivotr})\s{3}(\s{3,})?(\S.+?)$/)
				{
#					push @arr1, $indnt.$1;
					push @arr1, $1 if defined($1);
					push @arr2, ($2||'').$3 if defined($3);
				}
				else
				{
					push @arr1, $indnt.$_;
				}
			}
		}
		push @arrout, @arr1;
		push @arrout, @arr2;
		@chopped_lines = @arrout;
	}
	my $prevnew = 0;	
	foreach(@chopped_lines)
	{
		# if($_=~"LAMPIRAN"){
		# 	print $_;exit;
		# }

		chomp;
#		if (/^\s*references\s*$/i || /REFERENCES/ || /Bibliography/i || /References and Notes/ || /^\s*daftar pustaka\s*$/i)
		if (/^\s*daftar pustaka\s*$/i || /^\s*references\s*$/i)
                {
                        $in_refs = 1;
			push @newlines, $' if defined($'); # Capture bad input
                        next;
                }
#		if (/^\s*\bappendix\b/i || /_{6}.{0,10}$/ || /^\s*\btable\b/i || /wish to thank/i || /\bfigure\s+\d/ || /lampiran/i)
		if (/^\s*\blampiran\b/i || /^\s*\bl a m p i r a n\b/i || /^\s*\bappendix\b/i)
		{
			$in_refs = 0;
		}

		if (/^\s*$/)
		{
			if ($prevnew) { next; }
			$prevnew = 1;
		}
		else
		{
			$prevnew = 0;
		}

		if (/^\s*\d+\s*$/) { next; } # Page number
		if ($in_refs)
		{
			my $spaces = /^(\s+)/ ? length($1) : 0;
			if( @newlines && /^(\s+)[a-z]/ && _within(length($1),length($newlines[$#newlines]),5) ) {
				s/^\s+//s;
				$newlines[$#newlines] .= $_;					
			} else {
				if($newlines[$#newlines]=~ /(2nd|3rd|1st|[4-9][0-9]*th)$/ && ((length $_) + (length $newlines[$#newlines])) < 50){
					$newlines[$#newlines] .= " ".$_;					
				}else{
					push @newlines, $_;
				}
			}
		}
	}

	# We failed to find the reference section, we'll do a last-ditch effect at finding numbered
	# refs
	# unless($in_refs) {
	# 	my $first = 0;
	# 	my $lastnum = 0;
	# 	my $numwith = 0;
	# 	my $numwo = 0;
	# 	for(my $i = 0; $i < @chopped_lines; $i++) {
	# 		$_ = $chopped_lines[$i];
	# 		if( /^\s*[\[\(](\d+)[\]\)]/ || /^\s*(\d+)(?:\.|\s{5,})/ ) {
	# 			$first = $1 if $1 == 1;
	# 			if( $lastnum && $1 == $lastnum+1 ) {
	# 				$numwo = 0;
	# 				$numwith++;
	# 				$lastnum++;
	# 			} else {
	# 				$first = $i;
	# 				$lastnum = $1;
	# 			}
	# 		} elsif( $numwo++ == 5 ) { # Reset
	# 			$first = $lastnum = $numwith = $numwo = 0;
	# 		} elsif( $numwith == 5 ) {
	# 			last;
	# 		}
	# 	}
	# 	@newlines = splice(@chopped_lines,$first) if $first && $numwith == 5;
	# }
#warn "BEGIN REF SECTION\n", join("\n",@newlines), "\nEND REF SECTION\n";
	# Work out what sort of separation is used
	my $type = 0;
	my $TYPE_NEWLINE = 0;
	my $TYPE_INDENT = 1; # First line indented
	my $TYPE_NUMBER = 2;
	my $TYPE_NUMBERSQ = 3;
	my $TYPE_LETTERSQ = 4;
	my $TYPE_INDENT_OTHER = 5; # Other lines indented
	my $numnew = 0;
	my $numind = 0;
	my $numnum = 0;
	my $numsq = 0;
	my $lettsq = 0;
	my $indmin = 255;
	my $indmax = 0;
	my @indented;
	# Handle numbered references joined together (e.g. bad to-text conversion)
	my $ref_sect = join "\n", @newlines;
	my $ref_b = 1; my $ref_e = 2;
	my @num_refs;
	while( $ref_sect =~ s/(\[$ref_b\].+?)(?=\[$ref_e\])//sg ) {
		$ref_b++; $ref_e++;
		push @num_refs, split("\n", $1);
	}
	if( $ref_b >= 5 ) {
		@newlines = @num_refs;
		push @newlines, $ref_sect if defined($ref_sect);
	}

	# Resume normal processing



	foreach(@newlines)
	{
		# $_ = normalise_multichars($_);
		if (/^\s*$/)
		{
			$numnew++;
		}
		if (/^(\s+)\b/)
		{
			if (length $1 < $indmin) { $indmin = length $1; }
			if (length $1 > $indmax) { $indmax = length $1; }
			if( length($1) >= $indmax && /^\s+[A-Z]/ ) { $numind++ }
		}
		if (/^\s*\d+\.?\s+[[:alnum:]]/)
		{
			$numnum++;
		}
		if (/^\s*[\[\(]\d+[\]\)]\s+[[:alnum:]]/)
		{
			$numsq++;	
		}
		if (/^\s*[\[\(][A-Za-z]\w*[\]\)]\s/)
		{
			$lettsq++;
		}
	}

	# foreach(@layout){
	# 	$_ = normalise_multichars($_);
	# 	$_ =~ s/.*[^[:print:]]+//g;
	# }

# print Dumper(@newlines);exit;
	
#	if ($numnew < ($#newlines-5) && ($indmax > $indmin) && $indmax != 0 && $indmin != 255 && $indmax < 24) { $type = $TYPE_INDENT; }
# If references are seperated by blank lines, then we would expect to see around one blank line
# for each reference?
#warn "indmin=$indmin, indmax=$indmax\n";
	# if ($numnew < ($#newlines/2) && ($indmax >= $indmin) && $indmax != 0 && $indmin != 255 && $indmax < 24) { $type = $numind >= $#newlines/2 ? $TYPE_INDENT : $TYPE_INDENT_OTHER; }
	# if ($numnum > 3) { $type = $TYPE_NUMBER; }
	# if ($numsq > 3) { $type = $TYPE_NUMBERSQ; }
	# if ($lettsq > 3) { $type = $TYPE_LETTERSQ; }
	# print $type;exit;
	if ($type == $TYPE_NEWLINE)
	{
warn "type = NEWLINE" if $DEBUG;
		my $indmin = $indmin>5 ? $indmin + 3 : 5;
		my $kampret = 1;
		my $nl=0;
		my $i=0;
		my $nowline=""; 
		my $changecols=0; 
		my $cols=1;
		my $prevline="";
		my $firstline =0;
		my $lastline =0;
		my $col1left =-1;
		my $col1indent =-1;
		my $col2left =-1;
		my $col2indent =-1;
		my $finish = 0;
		my $tmp1 = "";
		my $tmp2 = "";
		my $tmp1pos=-1;
		my $Posisi =-1;
		my $cmplayout;
		my $cmpline;

		foreach(@newlines)
		{
			if(!trim($_)) {next;}
			$cmpline = $_;
			# print $cmpline."\n";
			$cmpline =~ s/\\/\\\\/g;
			$cmpline =~ s/\-/\\\-/g;
			$cmpline =~ s/\+/\\\+/g;
			$cmpline =~ s/\*/\\\*/g;
			$cmpline =~ s/\&/\\\&/g;
			$cmpline =~ s/\(/\\\(/g;
			$cmpline =~ s/\)/\\\)/g;
			$cmpline =~ s/\[/\\\[/g;
			$cmpline =~ s/\]/\\\]/g;
			$cmpline =~ s/\./\\\./g;
			$cmpline =~ s/\,/\\\,/g;
			$cmpline =~ s/\~/\\\~/g;
			$cmpline =~ s/ /\[\[:space:\]\]+/g;
			$finish =0;


			for($i=$firstline; $i< $#layout ;$i++){
				$cmplayout = $layout[$i];
				if($cmplayout){
					# if($cmplayout=~ /^lampiran/i || $cmplayout=~ /^l a m p i r a n/i){
					# 	last;
					# }
				}else{
					next;
				}
				$cmplayout =~ s/.*[^[:print:]]+//;
				# if($cmplayout){
				# 	if(index($cmplayout,$_)==-1){
				# 		$cmplayout =~ s/(.+?)  +(.+?)/$1 $2/g;
				# 	}
				# }
				$Posisi = strpos($cmplayout,$cmpline);
				# if($cmplayout=~"Shortest Path. Di dalam : 3rd International"){
				# 	print $Posisi."\n";
				# 	print $cmplayout."\n";
				# 	print $cmpline."\n";
				# 	exit;
				# }
					if($cmplayout=~"Ennis, G"){
						print $curr_ref."\n".$tmp1."\n";
						print $Posisi."\n";
						print $tmp1pos."\n";
						print $col1indent."\n";
						print $col2indent."\n";
						print $col2left."\n";
						print $cmplayout."\n";
						print $cmpline."\n";
						exit;
					}
				if($Posisi!=-1){
					if($Posisi==0 || $Posisi==$col2left){
						if($Posisi!=0){
							if($tmp1pos!=-1){
								if($tmp1pos<$Posisi){
									$col2left=$tmp1pos;
									$col2indent=$Posisi;
									push @ref_table, $curr_ref;
									$curr_ref = $tmp1;
									$curr_ref = merge_ref($curr_ref,$_);
									$tmp1 ="";$tmp1pos=-1;
								}else{
									if($curr_ref){
										if(trim($tmp1)){
											$curr_ref = merge_ref($curr_ref,$tmp1);
											$tmp1 ="";$tmp1pos=-1;
										}
										push @ref_table, $curr_ref;
									}
									$curr_ref = $_;																	
								}
							}else{
								if($curr_ref){
									if(trim($tmp1)){
										$curr_ref = merge_ref($curr_ref,$tmp1);
										$tmp1 ="";$tmp1pos=-1;
									}
									push @ref_table, $curr_ref;
								}
								$curr_ref = $_;								
							}
						}else{
							if($curr_ref){
								if(trim($tmp1)){
									$curr_ref = merge_ref($curr_ref,$tmp1);
									$tmp1 ="";$tmp1pos=-1;
								}
								push @ref_table, $curr_ref;
							}
							$curr_ref = $_;
						}
					}elsif(($Posisi==$col1indent && $col1indent!=-1) || ($Posisi==$col2indent && $col2indent!=-1)){
						if($tmp1pos!=-1){
							if($tmp1pos<$Posisi){
								$col2left=$tmp1pos;
								$col2indent=$Posisi;
								push @ref_table, $curr_ref;
								$curr_ref = $tmp1;
								$tmp1 ="";$tmp1pos=-1;
							}else{
								$col2indent = $Posisi;
								$curr_ref = merge_ref($curr_ref,$tmp1);
								$tmp1 ="";$tmp1pos=-1;
							}
						}
						$curr_ref = merge_ref($curr_ref,$_);
					}else{
					# if($cmplayout=~"Data                                mining."){
					# 	print $curr_ref."\n".$tmp1."\n";
					# 	print $Posisi."\n";
					# 	print $tmp1pos."\n";
					# 	print $col1indent."\n";
					# 	print $col2indent."\n";
					# 	print $col2left."\n";
					# 	print $cmplayout."\n";
					# 	print $cmpline."\n";
					# 	exit;
					# }
						if($Posisi < $col2indent && $Posisi-3 > 5 && $col2left==-1){
							$col2left = $Posisi;
							# $col2indent = $Posisi;
							$curr_ref = merge_ref($curr_ref,$tmp1);
							push @ref_table, $curr_ref;
							$curr_ref = $_;
							$tmp1 ="";$tmp1pos=-1;
							$finish=1;
							last;
						}elsif($Posisi-3 > 5 && $col2left==-1 && $col2indent!=-1){
							$col2left = $Posisi;
							# $col2indent = $Posisi;
							$curr_ref = merge_ref($curr_ref,$tmp1);
							push @ref_table, $curr_ref;
							$curr_ref = $_;
							$tmp1 ="";$tmp1pos=-1;
							$finish=1;
							last;
						}elsif($Posisi > $col2left && $col2left!=-1 && $Posisi-3 > 5 && $col2indent!=-1 && $tmp1pos!=-1){
							# $col2left = $Posisi;
							if($tmp1pos<$Posisi){
								$col2left=$tmp1pos;
								$col2indent=$Posisi;
								push @ref_table, $curr_ref;
								$curr_ref = "";
							}else{
									$col2indent = $Posisi;
								$finish=1;
							}
							$curr_ref = merge_ref($curr_ref,$tmp1);
							$curr_ref = merge_ref($curr_ref,$_);
							$tmp1 ="";$tmp1pos=-1;
							last;
						}elsif($Posisi > 0 && $col1indent==-1 && $Posisi-3 < 5){
							$col1indent = $Posisi;
							$curr_ref = merge_ref($curr_ref,$tmp1);
							$curr_ref = merge_ref($curr_ref,$_);
							$tmp1 ="";$tmp1pos=-1;
							$finish=1;
							last;
						}
						if(!trim($tmp1)){
							# print "AAAA";
							$tmp1=$_;
							$tmp1pos = $Posisi;
						}elsif($Posisi < $tmp1pos && ($Posisi< $col2indent && $Posisi-3 > 5 && $col2indent!=-1 && $tmp1pos-3 > 5)){
							# print "BBBB";
							$col2left = $Posisi;
							$col2indent = $tmp1pos;
							$curr_ref = merge_ref($curr_ref,$tmp1);
							push @ref_table, $curr_ref;
							$curr_ref = $_;
							$tmp1 ="";$tmp1pos=-1;
						}elsif($Posisi> $col2indent && $col2indent!=-1 && $tmp1pos-3 > 5){
							# print "CCCC";
							$col2left = $tmp1pos;
							$col2indent = $Posisi;
							$curr_ref = merge_ref($curr_ref,$tmp1);
							$curr_ref = merge_ref($curr_ref,$_);
							$tmp1 = "";
						}elsif($Posisi> $tmp1pos && $tmp1pos!= -1 && $col2indent==-1 && $col2left==-1 && $Posisi-3 > 5 && $tmp1pos-3 > 5){
							# print "CCCC";
							if($tmp1pos>5){
								$col2left = $tmp1pos;
							}
							$col2indent = $Posisi;
							if($col2left!=-1){
								push @ref_table, $curr_ref;
								$curr_ref = $tmp1;
								$curr_ref = merge_ref($curr_ref,$_);
								$tmp1 ="";$tmp1pos=-1;
							}else{
								$curr_ref = merge_ref($curr_ref,$tmp1);
								$curr_ref = merge_ref($curr_ref,$_);
								$tmp1 ="";$tmp1pos=-1;
							}
						}elsif($Posisi<=$tmp1pos && $Posisi > 0 && $Posisi-3 < 5){
							# print "DDDD";
							$col1indent = $Posisi;
							$curr_ref = merge_ref($curr_ref,$tmp1);
							$curr_ref = merge_ref($curr_ref,$_);
							$tmp1 ="";$tmp1pos=-1;
						}else{
							# print "EEEE";
							if($Posisi<$tmp1pos){
								if($Posisi>5){
									$col2left = $Posisi;
									if($curr_ref){
										push @ref_table, $curr_ref;
										$curr_ref="";
									}
								}
								if($tmp1pos>5){
									$col2indent = $tmp1pos;
								}
								$curr_ref = merge_ref($curr_ref,$tmp1);
								$curr_ref = merge_ref($curr_ref,$_);
								$tmp1 ="";$tmp1pos=-1;
							}elsif($Posisi==$tmp1pos){
								if($Posisi>5){
									$col2indent = $Posisi;
								}
								$curr_ref = merge_ref($curr_ref,$tmp1);
								$curr_ref = merge_ref($curr_ref,$_);
								$tmp1 ="";$tmp1pos=-1;
							}elsif($col2indent!=-1){
								if($tmp1pos>5){
									$col2left = $tmp1pos;
									if($curr_ref){
										push @ref_table, $curr_ref;
										$curr_ref="";
									}
								}
								if($Posisi>5){
									$col2indent = $Posisi;
								}
								$curr_ref = merge_ref($curr_ref,$tmp1);
								$curr_ref = merge_ref($curr_ref,$_);
								$tmp1 ="";$tmp1pos=-1;
							}else{
								$curr_ref = merge_ref($curr_ref,$tmp1);
								$tmp1pos = $Posisi;
								$tmp1 = $_;								
							}
						}

						# print $_;
						# print "\n";
					}

					# if($firstline==0){
						$firstline=$i;
					# }
					# print "\n";
					# print $_;
					# print "\n";
					# print index($layout[$i],$_);
					# print "\n";
					$finish=1;
					last;
				}
			}
			if($finish==1){
				next
			}
			$firstline =$firstline-300;
			for($i=$firstline; $i< $#layout ;$i++){
				$cmplayout = $layout[$i];
				if($cmplayout){
					# if($cmplayout=~ /^lampiran/i || $cmplayout=~ /^l a m p i r a n/i){
					# 	last;
					# }
				}else{
					next;
				}
				$cmplayout =~ s/.*[^[:print:]]+//;
				# if($cmplayout){
				# 	if(index($cmplayout,$_)==-1){
				# 		$cmplayout =~ s/(.+?)  +(.+?)/$1 $2/g;
				# 	}
				# }
				$Posisi = strpos($cmplayout,$cmpline);
				# if($cmplayout=~"Nielsen Norman Group. 2000. E-"){
				# 	print $Posisi."\n";
				# 	print $cmplayout."\n";
				# 	print $cmpline."\n";
				# }
				if($Posisi!=-1){
					# if($cmplayout=~"Ennis, G . [26 Januari 2006]. 802.11"){
					# 	print $curr_ref."\n".$tmp1."\n";
					# 	print $Posisi."\n";
					# 	print $tmp1pos."\n";
					# 	print $col1indent."\n";
					# 	print $col2indent."\n";
					# 	print $col2left."\n";
					# 	print $cmplayout."\n";
					# 	print $cmpline."\n";
					# 	exit;
					# }
					if($Posisi==0 || $Posisi==$col2left){
						if($tmp1pos!=-1){
							if($tmp1pos<$Posisi){
								$col2left=$tmp1pos;
								$col2indent=$Posisi;
								push @ref_table, $curr_ref;
								$curr_ref = $tmp1;
								$curr_ref = merge_ref($curr_ref,$_);
								$tmp1 ="";$tmp1pos=-1;
							}else{
								if($curr_ref){
									if(trim($tmp1)){
										$curr_ref = merge_ref($curr_ref,$tmp1);
										$tmp1 ="";$tmp1pos=-1;
									}
									push @ref_table, $curr_ref;
								}
								$curr_ref = $_;																	
							}
						}else{
							if($curr_ref){
								if(trim($tmp1)){
									$curr_ref = merge_ref($curr_ref,$tmp1);
									$tmp1 ="";$tmp1pos=-1;
								}
								push @ref_table, $curr_ref;
							}
							$curr_ref = $_;								
						}
					}elsif(($Posisi==$col1indent && $col1indent!=-1) || ($Posisi==$col2indent && $col2indent!=-1)){
						if($tmp1pos!=-1){
							if($tmp1pos<$Posisi){
								$col2left=$tmp1pos;
								$col2indent=$Posisi;
								push @ref_table, $curr_ref;
								$curr_ref = $tmp1;
								$tmp1 ="";$tmp1pos=-1;
							}else{
								$col2indent = $Posisi;
								$curr_ref = merge_ref($curr_ref,$tmp1);
								$tmp1 ="";$tmp1pos=-1;
							}
						}
						$curr_ref = merge_ref($curr_ref,$_);
					}else{
						if($Posisi < $col2indent && $Posisi-3 > 5 && $col2left==-1){
							$col2left = $Posisi;
							# $col2indent = $Posisi;
							$curr_ref = merge_ref($curr_ref,$tmp1);
							push @ref_table, $curr_ref;
							$curr_ref = $_;
							$tmp1 ="";$tmp1pos=-1;
							$finish=1;
							last;
						}elsif($Posisi-3 > 5 && $col2left==-1 && $col2indent!=-1){
							$col2left = $Posisi;
							# $col2indent = $Posisi;
							$curr_ref = merge_ref($curr_ref,$tmp1);
							push @ref_table, $curr_ref;
							$curr_ref = $_;
							$tmp1 ="";$tmp1pos=-1;
							$finish=1;
							last;
						}elsif($Posisi > $col2left && $col2left!=-1 && $Posisi-3 > 5 && $col2indent!=-1 && $tmp1pos!=-1){
							# $col2left = $Posisi;
							if($tmp1pos<$Posisi){
								$col2left=$tmp1pos;
								$col2indent=$Posisi;
								push @ref_table, $curr_ref;
								$curr_ref = "";
							}else{
								$col2indent = $Posisi;
								$finish=1;
							}
							$curr_ref = merge_ref($curr_ref,$tmp1);
							$curr_ref = merge_ref($curr_ref,$_);
							$tmp1 ="";$tmp1pos=-1;
							last;
						}elsif($Posisi > 0 && $col1indent==-1 && $Posisi-3 < 5){
							$col1indent = $Posisi;
							$curr_ref = merge_ref($curr_ref,$tmp1);
							$curr_ref = merge_ref($curr_ref,$_);
							$tmp1 ="";$tmp1pos=-1;
							last;
						}

						if(!trim($tmp1)){
							# print "AAAA";
							$tmp1=$_;
							$tmp1pos = $Posisi;
						}elsif($Posisi < $tmp1pos && ($Posisi< $col2indent && $Posisi-3 > 5 && $col2indent!=-1 && $tmp1pos-3 > 5)){
							# print "BBBB";
							$col2left = $Posisi;
							$col2indent = $tmp1pos;
							$curr_ref = merge_ref($curr_ref,$tmp1);
							push @ref_table, $curr_ref;
							$curr_ref = $_;
							$tmp1 ="";$tmp1pos=-1;
						}elsif($Posisi> $col2indent && $col2indent!=-1 && $tmp1pos-3 > 5){
							# print "CCCC";
							$col2left = $tmp1pos;
							$col2indent = $Posisi;
							$curr_ref = merge_ref($curr_ref,$tmp1);
							$curr_ref = merge_ref($curr_ref,$_);
							$tmp1 = "";
						}elsif($Posisi> $tmp1pos && $col2indent==-1 && $col2left==-1 && $Posisi-3 > 5 && $tmp1pos-3 > 5){
							# print "CCCC";
							if($tmp1pos>5){
								$col2left = $tmp1pos;
							}
							$col2indent = $Posisi;
							$curr_ref = merge_ref($curr_ref,$tmp1);
							$curr_ref = merge_ref($curr_ref,$_);
							$tmp1 ="";$tmp1pos=-1;
						}elsif($Posisi> $tmp1pos && $tmp1pos!= -1 && $Posisi > 0 && $Posisi-3 < 5){
							# print "DDDD";
							$col1indent = $Posisi;
							$curr_ref = merge_ref($curr_ref,$tmp1);
							$curr_ref = merge_ref($curr_ref,$_);
							$tmp1 ="";$tmp1pos=-1;
						}else{
							# print "EEEE";
							if($Posisi<$tmp1pos){
								if($Posisi>5){
									$col2left = $Posisi;
									if($curr_ref){
										push @ref_table, $curr_ref;
										$curr_ref="";
									}
								}
								if($tmp1pos>5){
									$col2indent = $tmp1pos;
								}
								$curr_ref = merge_ref($curr_ref,$tmp1);
								$curr_ref = merge_ref($curr_ref,$_);
								$tmp1 ="";$tmp1pos=-1;
							}elsif($Posisi==$tmp1pos){
								if($Posisi>5){
									$col2indent = $Posisi;
								}
								$curr_ref = merge_ref($curr_ref,$tmp1);
								$curr_ref = merge_ref($curr_ref,$_);
								$tmp1 ="";$tmp1pos=-1;
							}elsif($col2indent!=-1){
								if($tmp1pos>5){
									$col2left = $tmp1pos;
									if($curr_ref){
										push @ref_table, $curr_ref;
										$curr_ref="";
									}
								}
								if($Posisi>5){
									$col2indent = $Posisi;
								}
								$curr_ref = merge_ref($curr_ref,$tmp1);
								$curr_ref = merge_ref($curr_ref,$_);
								$tmp1 ="";$tmp1pos=-1;
							}else{
								$curr_ref = merge_ref($curr_ref,$tmp1);
								$tmp1pos = $Posisi;
								$tmp1 = $_;								
							}
						}

						# print $_;
						# print "\n";
					}

					# if($firstline==0){
						$firstline=$i;
					# }
					# print "\n";
					# print $_;
					# print "\n";
					# print index($layout[$i],$_);
					# print "\n";
					$finish=1;
					last;
				}
			}
			if($finish==1){
				next
			}
			if (/^(.+)(\.)(\s*)\d{4}(\s*)(\.)(.*)$/)
			{
				if ($curr_ref) {
					# if($curr_ref !~ /(.+)\.\s*$/ && $curr_ref !~ /(.+)](\.*)\s*$/){
					# 	$curr_ref=~s/$prevline//g;
					# 	$_ = $prevline.$_;
					# }
					if(trim($tmp1)){
						$curr_ref = $curr_ref." ".$tmp1;
						$tmp1 ="";$tmp1pos=-1;
					}
					push @ref_table, $curr_ref;
					$curr_ref = "";					
					$nl=0;
				}
			}
				#next;
			# elsif(/^(.+)(\.+)\s$/){
			# 	# print $_."AAAA\n";
			# 	if ($curr_ref) {
			# 		push @ref_table, $curr_ref; 
			# 	}
			# 	$curr_ref = $_;
			# 	#$kampret=0;
			# 	next;
			# }
			# Trim off any whitespace surrounding chunk
			s/^\s*(.+)\s*$/$1/;
			s/^(.+)[\\-]+$/$1/;

			if ($curr_ref =~/http:\/\/.*$/) {
				$curr_ref = $curr_ref.$_;
			}else {
				s/\./\. /g;
				while (/(http:\/\/.+)\. (\w+)/){
					s/(http:\/\/.+)\. (\w+)/$1\.$2/g;
				}
				s/(Proceeding |Proceding )/Proceedings /g;
				$curr_ref .= " ".$_;
			}
			# $kampret =1;
			# if($nl>=2){
			# 	$prevline = $_;
			# }else{
			# 	$prevline = "";				
			# }
			# $nl++;
			$tmp1 = "";
		}
		if ($curr_ref) {
			if(trim($tmp1)){
				$curr_ref = $curr_ref." ".$tmp1;
				$tmp1 ="";$tmp1pos=-1;
			}
			push @ref_table, $curr_ref; 
		}
		# if($#ref_table <4 || $#ref_table >21){
		# 	@ref_table = ();
		# 	$curr_ref="";
		# 	$indmin = $indmin>5 ? $indmin + 3 : 5;
		# 	$kampret = 1;
		# 	$nl=0;
		# 	$i=0;
		# 	$nowline=""; 
		# 	$changecols=0; 
		# 	$cols=1;
		# 	$prevline="";
		# 	$firstline =0;
		# 	$lastline =0;
		# 	$col1left =-1;
		# 	$col1indent =-1;
		# 	$col2left =-1;
		# 	$col2indent =-1;
		# 	$finish = 0;
		# 	$tmp1 = "";
		# 	$tmp2 = "";
		# 	$tmp1pos=-1;
		# 	$Posisi =-1;
		# 	$cmplayout="";

		# 	foreach(@newlines)
		# 	{
		# 		if(!trim($_)) {next;}
				
		# 		$finish =0;
		# 		for($i=$firstline; $i< $#layout ;$i++){
		# 			$cmplayout = $layout[$i];
		# 			if($cmplayout){
		# 				if(index($cmplayout,$_)==-1){
		# 					$cmplayout =~ s/(.+?)  +(.+?)/$1 $2/g;
		# 				}
		# 			}else{
		# 				next;
		# 			}
		# 			$cmplayout =~ s/.*[^[:print:]]+//;
		# 			if(index($cmplayout,$_)!=-1){
		# 				# if($_=~"Dillon, William R. and Goldstein, Matthew."){
		# 				# 	print $curr_ref."\n".$tmp1."\n";
		# 				# 	print $Posisi."\n";
		# 				# 	print $tmp1pos."\n";
		# 				# 	print $col1indent."\n";
		# 				# 	print $col2indent."\n";
		# 				# 	print $col2left."\n";
		# 				# 	exit;						
		# 				# }
		# 				$Posisi = index($cmplayout,$_);
		# 				if($Posisi ==0 || $Posisi==$col2left){
		# 					if($curr_ref){
		# 						if(trim($tmp1)){
		# 							$curr_ref = merge_ref($curr_ref,$tmp1);
		# 							$tmp1="";
		# 						}
		# 						push @ref_table, $curr_ref;
		# 					}
		# 					$curr_ref = $_;
		# 				}elsif(($Posisi==$col1indent && $col1indent!=-1) || ($Posisi==$col2indent && $col2indent!=-1)){
		# 					if(trim($tmp1)){
		# 						$curr_ref = merge_ref($curr_ref,$tmp1);
		# 						$tmp1="";
		# 					}
		# 					$curr_ref = merge_ref($curr_ref,$_);
		# 				}else{
		# 					#print $curr_ref."    ".$tmp1;
		# 					# print $Posisi." ";
		# 					# print $tmp1pos." ";
		# 					# print $col2indent." ";
		# 					# print $col2left." ";
		# 					if($Posisi < $col2indent && $Posisi-3 > 5 && $col2left==-1){
		# 						$col2left = $Posisi;
		# 						# $col2indent = $Posisi;
		# 						$curr_ref = merge_ref($curr_ref,$tmp1);
		# 						push @ref_table, $curr_ref;
		# 						$curr_ref = $_;
		# 						$tmp1 ="";
		# 						$finish=1;
		# 						last;
		# 					}elsif($Posisi-3 > 5 && $col2left==-1 && $col2indent!=-1){
		# 						$col2left = $Posisi;
		# 						# $col2indent = $Posisi;
		# 						$curr_ref = merge_ref($curr_ref,$tmp1);
		# 						push @ref_table, $curr_ref;
		# 						$curr_ref = $_;
		# 						$tmp1 ="";
		# 						$finish=1;
		# 						last;
		# 					}elsif($Posisi > $col2left && $col2left!=-1 && $Posisi-3 > 5 && $col2indent!=-1){
		# 						# $col2left = $Posisi;
		# 						$col2indent = $Posisi;
		# 						$curr_ref = merge_ref($curr_ref,$tmp1);
		# 						$curr_ref = merge_ref($curr_ref,$_);
		# 						$tmp1 ="";
		# 						$finish=1;
		# 						last;							
		# 					}

		# 					if(!trim($tmp1)){
		# 						# print "AAAA";
		# 						$tmp1=$_;
		# 						$tmp1pos = $Posisi;
		# 					}elsif($Posisi < $tmp1pos || ($Posisi< $col2indent && $Posisi-3 > 5 && $col2indent!=-1)){
		# 						# print "BBBB";
		# 						$col2left = $Posisi;
		# 						$col2indent = $tmp1pos;
		# 						$curr_ref = merge_ref($curr_ref,$tmp1);
		# 						push @ref_table, $curr_ref;
		# 						$curr_ref = $_;
		# 						$tmp1 ="";
		# 					}elsif($Posisi > $tmp1pos || ($Posisi> $col2indent && $col2indent!=-1)){
		# 						# print "CCCC";
		# 						$col2left = $tmp1pos;
		# 						$col2indent = $Posisi;
		# 						$curr_ref = merge_ref($curr_ref,$tmp1);
		# 						$curr_ref = merge_ref($curr_ref,$_);
		# 						$tmp1 = "";
		# 					}elsif($Posisi<=$tmp1pos && $Posisi > 0 && $Posisi-3 < 5){
		# 						# print "DDDD";
		# 						$col1indent = $Posisi;
		# 						$curr_ref = merge_ref($curr_ref,$tmp1);
		# 						$curr_ref = merge_ref($curr_ref,$_);
		# 						$tmp1 = "";							
		# 					}else{
		# 						# print "EEEE";
		# 						if($Posisi<$tmp1pos){
		# 							if($Posisi>5){
		# 								$col2left = $Posisi;
		# 							}
		# 							$col2indent = $tmp1pos;
		# 						}elsif($Posisi==$tmp1pos){
		# 							$col2indent = $Posisi;
		# 						}else{
		# 							if($tmp1pos>5){
		# 								$col2left = $tmp1pos;
		# 							}
		# 							$col2indent = $Posisi;
		# 						}
		# 						$curr_ref = merge_ref($curr_ref,$tmp1);
		# 						$curr_ref = merge_ref($curr_ref,$_);
		# 						$tmp1 = "";							
		# 					}
		# 					# print $_;
		# 					# print "\n";
		# 				}

		# 				# if($firstline==0){
		# 					$firstline=$i;
		# 				# }
		# 				# print "\n";
		# 				# print $_;
		# 				# print "\n";
		# 				# print index($layout[$i],$_);
		# 				# print "\n";
		# 				$finish=1;
		# 				last;
		# 			}
		# 		}
		# 		if($finish==1){
		# 			next
		# 		}
		# 		$firstline =$firstline-300;

		# 		if (/^(.+)(\.)(\s*)\d{4}(\s*)(\.)(.*)$/)
		# 		{
		# 			if ($curr_ref) {
		# 				# if($curr_ref !~ /(.+)\.\s*$/ && $curr_ref !~ /(.+)](\.*)\s*$/){
		# 				# 	$curr_ref=~s/$prevline//g;
		# 				# 	$_ = $prevline.$_;
		# 				# }
		# 				if(trim($tmp1)){
		# 					$curr_ref = $curr_ref." ".$tmp1;
		# 					$tmp1="";
		# 				}
		# 				push @ref_table, $curr_ref;
		# 				$curr_ref = "";					
		# 				$nl=0;
		# 			}
		# 		}
		# 			#next;
		# 		elsif(/^(.+)(\.+)\s$/){
		# 			# print $_."AAAA\n";
		# 			if ($curr_ref) {
		# 				push @ref_table, $curr_ref; 
		# 			}
		# 			$curr_ref = $_;
		# 			#$kampret=0;
		# 			next;
		# 		}
		# 		# Trim off any whitespace surrounding chunk
		# 		s/^\s*(.+)\s*$/$1/;
		# 		s/^(.+)[\\-]+$/$1/;

		# 		if ($curr_ref =~/http:\/\/.*$/) {
		# 			$curr_ref = $curr_ref.$_;
		# 		}else {
		# 			s/\./\. /g;
		# 			while (/(http:\/\/.+)\. (\w+)/){
		# 				s/(http:\/\/.+)\. (\w+)/$1\.$2/g;
		# 			}
		# 			s/(Proceeding |Proceding )/Proceedings /g;
		# 			$curr_ref .= " ".$_;
		# 		}
		# 		# $kampret =1;
		# 		# if($nl>=2){
		# 		# 	$prevline = $_;
		# 		# }else{
		# 		# 	$prevline = "";				
		# 		# }
		# 		# $nl++;
		# 		$tmp1="";
		# 	}
		# 	if ($curr_ref) {
		# 		if(trim($tmp1)){
		# 			$curr_ref = $curr_ref." ".$tmp1;
		# 			$tmp1="";
		# 		}
		# 		push @ref_table, $curr_ref; 
		# 	}

		# }

		# if($#ref_table <4 || $#ref_table >21){
		# 	@ref_table = ();
		# 	$curr_ref="";
		# 	$indmin = $indmin>5 ? $indmin + 3 : 5;
		# 	$kampret = 1;
		# 	$nl=0;
		# 	$i=0;
		# 	$nowline=""; 
		# 	$changecols=0; 
		# 	$cols=1;
		# 	$prevline="";
		# 	$firstline =0;
		# 	$lastline =0;
		# 	$col1left =-1;
		# 	$col1indent =-1;
		# 	$col2left =-1;
		# 	$col2indent =-1;
		# 	$finish = 0;
		# 	$tmp1 = "";
		# 	$tmp2 = "";
		# 	$tmp1pos=-1;
		# 	$Posisi =-1;
		# 	$cmplayout="";


		# 	foreach(@newlines)
		# 	{
		# 		if(!trim($_)) {next;}
		# 		if (/^(.+)(\.)(\s*)\d{4}(\s*)(\.)(.*)$/)
		# 		{
		# 			if ($curr_ref) {
		# 				# if($curr_ref !~ /(.+)\.\s*$/ && $curr_ref !~ /(.+)](\.*)\s*$/){
		# 				# 	$curr_ref=~s/$prevline//g;
		# 				# 	$_ = $prevline.$_;
		# 				# }
		# 				if(trim($tmp1)){
		# 					$curr_ref = $curr_ref." ".$tmp1;
		# 					$tmp1="";
		# 				}
		# 				push @ref_table, $curr_ref;
		# 				$curr_ref = "";					
		# 				$nl=0;
		# 			}
		# 		}
		# 			#next;
		# 		elsif(/^(.+)(\.+)\s$/){
		# 			# print $_."AAAA\n";
		# 			if ($curr_ref) {
		# 				push @ref_table, $curr_ref; 
		# 			}
		# 			$curr_ref = $_;
		# 			#$kampret=0;
		# 			next;
		# 		}
		# 		# Trim off any whitespace surrounding chunk
		# 		s/^\s*(.+)\s*$/$1/;
		# 		s/^(.+)[\\-]+$/$1/;

		# 		if ($curr_ref =~/http:\/\/.*$/) {
		# 			$curr_ref = $curr_ref.$_;
		# 		}else {
		# 			s/\./\. /g;
		# 			while (/(http:\/\/.+)\. (\w+)/){
		# 				s/(http:\/\/.+)\. (\w+)/$1\.$2/g;
		# 			}
		# 			s/(Proceeding |Proceding )/Proceedings /g;
		# 			$curr_ref .= " ".$_;
		# 		}
		# 		# $kampret =1;
		# 		# if($nl>=2){
		# 		# 	$prevline = $_;
		# 		# }else{
		# 		# 	$prevline = "";				
		# 		# }
		# 		# $nl++;
		# 		$tmp1pos="";
		# 	}
		# 	if ($curr_ref) {
		# 		if(trim($tmp1)){
		# 			$curr_ref = $curr_ref." ".$tmp1;
		# 			$tmp1="";
		# 		}
		# 		push @ref_table, $curr_ref; 
		# 	}
		# }

		# if($#ref_table <4 || $#ref_table >21){
		# 	@ref_table = ();
		# 	$curr_ref="";
		# 	$indmin = $indmin>5 ? $indmin + 3 : 5;
		# 	$kampret = 1;
		# 	$nl=0;
		# 	$i=0;
		# 	$nowline=""; 
		# 	$changecols=0; 
		# 	$cols=1;
		# 	$prevline="";
		# 	$firstline =0;
		# 	$lastline =0;
		# 	$col1left =-1;
		# 	$col1indent =-1;
		# 	$col2left =-1;
		# 	$col2indent =-1;
		# 	$finish = 0;
		# 	$tmp1 = "";
		# 	$tmp2 = "";
		# 	$tmp1pos=-1;
		# 	$Posisi =-1;
		# 	$cmplayout="";

		# 	foreach(@newlines)
		# 	{
		# 		if(!trim($_)) {next;}
				
		# 		$finish =0;
		# 		for($i=$firstline; $i< $#layout ;$i++){
		# 			$cmplayout = $layout[$i];
		# 			if($cmplayout){

		# 			}else{
		# 				next;
		# 			}
		# 			$cmplayout =~ s/.*[^[:print:]]+//;
		# 			# if($cmplayout){
		# 			# 	if(index($cmplayout,$_)==-1){
		# 			# 		$cmplayout =~ s/(.+?)  +(.+?)/$1 $2/g;
		# 			# 	}
		# 			# }

		# 			if(index($cmplayout,$_)!=-1){
		# 				# if($_=~"with Local Context Analysis. ACM"){
		# 				# 	print $curr_ref."\n".$tmp1."\n";
		# 				# 	print $Posisi."\n";
		# 				# 	print $tmp1pos."\n";
		# 				# 	print $col1indent."\n";
		# 				# 	print $col2indent."\n";
		# 				# 	print $col2left."\n";
		# 				# 	exit;						
		# 				# }
		# 				$Posisi = index($cmplayout,$_);
		# 				if($Posisi ==0 || $Posisi==$col2left){
		# 					if($curr_ref){
		# 						if(trim($tmp1)){
		# 							$curr_ref = merge_ref($curr_ref,$tmp1);
		# 							$tmp1="";
		# 						}
		# 						push @ref_table, $curr_ref;
		# 					}
		# 					$curr_ref = $_;
		# 				}elsif(($Posisi==$col1indent && $col1indent!=-1) || ($Posisi==$col2indent && $col2indent!=-1)){
		# 					if(trim($tmp1)){
		# 						$curr_ref = merge_ref($curr_ref,$tmp1);
		# 						$tmp1="";
		# 					}
		# 					$curr_ref = merge_ref($curr_ref,$_);
		# 				}else{
		# 					#print $curr_ref."    ".$tmp1;
		# 					# print $Posisi." ";
		# 					# print $tmp1pos." ";
		# 					# print $col2indent." ";
		# 					# print $col2left." ";
		# 					if($Posisi < $col2indent && $Posisi-3 > 5 && $col2left==-1){
		# 						$col2left = $Posisi;
		# 						# $col2indent = $Posisi;
		# 						$curr_ref = merge_ref($curr_ref,$tmp1);
		# 						push @ref_table, $curr_ref;
		# 						$curr_ref = $_;
		# 						$tmp1 ="";
		# 						$finish=1;
		# 						last;
		# 					}elsif($Posisi-3 > 5 && $col2left==-1 && $col2indent!=-1){
		# 						$col2left = $Posisi;
		# 						# $col2indent = $Posisi;
		# 						$curr_ref = merge_ref($curr_ref,$tmp1);
		# 						push @ref_table, $curr_ref;
		# 						$curr_ref = $_;
		# 						$tmp1 ="";
		# 						$finish=1;
		# 						last;
		# 					}elsif($Posisi > $col2left && $col2left!=-1 && $Posisi-3 > 5 && $col2indent!=-1){
		# 						# $col2left = $Posisi;
		# 						$col2indent = $Posisi;
		# 						$curr_ref = merge_ref($curr_ref,$tmp1);
		# 						$curr_ref = merge_ref($curr_ref,$_);
		# 						$tmp1 ="";
		# 						$finish=1;
		# 						last;							
		# 					}

		# 					if(!trim($tmp1)){
		# 						# print "AAAA";
		# 						$tmp1=$_;
		# 						$tmp1pos = $Posisi;
		# 					}elsif($Posisi < $tmp1pos || ($Posisi< $col2indent && $Posisi-3 > 5 && $col2indent!=-1)){
		# 						# print "BBBB";
		# 						$col2left = $Posisi;
		# 						$col2indent = $tmp1pos;
		# 						$curr_ref = merge_ref($curr_ref,$tmp1);
		# 						push @ref_table, $curr_ref;
		# 						$curr_ref = $_;
		# 						$tmp1 ="";
		# 					}elsif($Posisi > $tmp1pos || ($Posisi> $col2indent && $col2indent!=-1)){
		# 						# print "CCCC";
		# 						$col2left = $tmp1pos;
		# 						$col2indent = $Posisi;
		# 						$curr_ref = merge_ref($curr_ref,$tmp1);
		# 						$curr_ref = merge_ref($curr_ref,$_);
		# 						$tmp1 = "";
		# 					}elsif($Posisi<=$tmp1pos && $Posisi > 0 && $Posisi-3 < 5){
		# 						# print "DDDD";
		# 						$col1indent = $Posisi;
		# 						$curr_ref = merge_ref($curr_ref,$tmp1);
		# 						$curr_ref = merge_ref($curr_ref,$_);
		# 						$tmp1 = "";							
		# 					}else{
		# 						# print "EEEE";
		# 						if($Posisi<$tmp1pos){
		# 							if($Posisi>5){
		# 								$col2left = $Posisi;
		# 							}
		# 							$col2indent = $tmp1pos;
		# 						}elsif($Posisi==$tmp1pos){
		# 							$col2indent = $Posisi;
		# 						}else{
		# 							if($tmp1pos>5){
		# 								$col2left = $tmp1pos;
		# 							}
		# 							$col2indent = $Posisi;
		# 						}
		# 						$curr_ref = merge_ref($curr_ref,$tmp1);
		# 						$curr_ref = merge_ref($curr_ref,$_);
		# 						$tmp1 = "";							
		# 					}
		# 					# print $_;
		# 					# print "\n";
		# 				}

		# 				# if($firstline==0){
		# 					$firstline=$i;
		# 				# }
		# 				# print "\n";
		# 				# print $_;
		# 				# print "\n";
		# 				# print index($layout[$i],$_);
		# 				# print "\n";
		# 				$finish=1;
		# 				last;
		# 			}
		# 		}
		# 		if($finish==1){
		# 			next
		# 		}
		# 		$firstline =$firstline-300;

		# 		if (/^(.+)(\.)(\s*)\d{4}(\s*)(\.)(.*)$/)
		# 		{
		# 			if ($curr_ref) {
		# 				# if($curr_ref !~ /(.+)\.\s*$/ && $curr_ref !~ /(.+)](\.*)\s*$/){
		# 				# 	$curr_ref=~s/$prevline//g;
		# 				# 	$_ = $prevline.$_;
		# 				# }
		# 				if(trim($tmp1)){
		# 					$curr_ref = $curr_ref." ".$tmp1;
		# 					$tmp1="";
		# 				}
		# 				push @ref_table, $curr_ref;
		# 				$curr_ref = "";					
		# 				$nl=0;
		# 			}
		# 		}
		# 			#next;
		# 		elsif(/^(.+)(\.+)\s$/){
		# 			# print $_."AAAA\n";
		# 			if ($curr_ref) {
		# 				push @ref_table, $curr_ref; 
		# 			}
		# 			$curr_ref = $_;
		# 			#$kampret=0;
		# 			next;
		# 		}
		# 		# Trim off any whitespace surrounding chunk
		# 		s/^\s*(.+)\s*$/$1/;
		# 		s/^(.+)[\\-]+$/$1/;

		# 		if ($curr_ref =~/http:\/\/.*$/) {
		# 			$curr_ref = $curr_ref.$_;
		# 		}else {
		# 			s/\./\. /g;
		# 			while (/(http:\/\/.+)\. (\w+)/){
		# 				s/(http:\/\/.+)\. (\w+)/$1\.$2/g;
		# 			}
		# 			s/(Proceeding |Proceding )/Proceedings /g;
		# 			$curr_ref .= " ".$_;
		# 		}
		# 		# $kampret =1;
		# 		# if($nl>=2){
		# 		# 	$prevline = $_;
		# 		# }else{
		# 		# 	$prevline = "";				
		# 		# }
		# 		# $nl++;
		# 		$tmp1pos="";
		# 	}
		# 	if ($curr_ref) {
		# 		if(trim($tmp1)){
		# 			$curr_ref = $curr_ref." ".$tmp1;
		# 			$tmp1="";
		# 		}
		# 		push @ref_table, $curr_ref; 
		# 	}
		# }
	}

	# print Dumper(@ref_table);exit;
	my @refs_out = ();
	# A little cleaning up before returning
	my $prev_author;

	my $initial_match = "(?:\\b[[:alpha:]\\p{L}\\'\\(\\)]\\.\\-|\\b[[:alpha:]\\p{L}\\'\\(\\)\\-]\\b)";	
	my $name_match = "(?:(?:[[:alpha:]\\p{L},;&-\\(\\)\\'\\-]+)\\b)";
	my $conjs = "(?:\\s+und\\s+|\\s+band\\s+|\\s|,|&|;)";
	my $authors	="(^(?:$initial_match|$name_match|$conjs)+?)";

	for (@ref_table)
	{
		if(!trim($_)){
			next;
		}
		if(/^[A-Za-z0-9 ]+$/){
			next;
		}
		if(/\.\.\.\./){
			next;
		}
		s/([[:alpha:]])\-\s+/$1/g; # End of a line hyphen
		s/^\s*[\[\(]([^\]]+)[\]\)](.+)$/($1) $2/s;
		s/^[\(]([^\)]+)[\)] \.(.+)$/($1)\.$2/s;
		# Same author as previous citation
		$prev_author && s/^((?:[\(\[]\w+[\)\]])|(?:\d{1,3}\.))[\s_]{8,}/$1 $prev_author /;
		if( /^(?:(?:[\(\[]\w+[\)\]])|(?:\d{1,3}\.))\s*([^,]+?)(?:,|and)/ ) {
			$prev_author = $1;
		} else {
			undef $prev_author;
		}

		while(/([A-Za-z]+)\.([A-Za-z])\./){
			s/([A-Za-z]+)\.([A-Za-z])\./$1 $2\./g;
		}
		s/(http:\/\/.+) *(\[.*)/$1 $2/g;

		s/\s\s+/ /g;
		s/^\s*(.+)\s*$/$1/;

		# s/^\((.+)\) ([A-Za-z ]+)\./$2\./;
		# s/^\((.+)\) ([A-Za-z ]+)\, ([A-Za-z ]+)\./$2\./;
		# s/^\(([^\)]+)\) *\./$1\./;
		# s/^\((.+)\) ([A-Za-z ]+)\./$2\./;
		s/ and\. / and /g;
		s/Dept\. /Department /g;
		s/Intl\. /International /g;
		s/802\. 11/802\.11/g;
		s/H\. 323/H\.323/g;
		s/ ([Kk]eputusan) [Nn][Oo]\./ $1 nomor/g;
		s/[\.\,] *Inc\.*/ Inc\./gi;
		s/[\.\,] *st\. /St /gi;

		s/([\.:\, ])volume[\. ]+([0-9])/$1 vol\. $2/gi;
		s/([\.:\, ])vol[\. ]+([0-9]+)/$1 vol\. $2/gi;
		s/([\.:\, ])no[\. ]+([0-9]+)/ no\. $2/gi;
		s/\. no\. ([0-9]+)/ no\. $1/gi;
		s/ (hlm|halaman)\.* *([A-Z0-9][0-9]*)/ hlm\. $2/gi;
		s/ (Proceedings of|Proc\.* of|proceeding of) / Proceedings of /gi;
		s/ (Proceedings|Proc\.*|proceeding) / Proceedings /gi;
		s/\, Proceedings of /\. Proceedings of /gi;

		while(/([0-9])\. ([0-9]{1,2})/){
			s/([0-9])\. ([0-9]{1,2})/$1\.$2/g;
		}

		s/([0-9]{4}[a-z]{0,1}) /$1\. /g;
		s/([0-9]{4}[a-z]{0,1})\,/$1\. /g;
		# s/^$authors\,* ([0-9]{4}[a-z]{0,1})\./$1\. $2\./g;
		s/ ([A-Z][a-z]*)\,* ([0-9]{4}[a-z]{0,1})\./ $1\. $2\./g;
		s/(\([A-Za-z]+\)) ([0-9]{4}[a-z]{0,1})\./$1\. $2\./g;
		s/ (the)\./ $1/gi;
		s/ (art)\./ $1/gi;
		s/ (trans)\./ $1\,/gi;
		s/ geosci\. / GeoScience /gi;
		s/ remote sens\. / Remote Sensing /gi;

		s/\.* *\[skripsi\]/ \[skripsi\]/gi;
		s/\.* *\[tesis\]/ \[tesis\]/gi;
		s/\.* *\[thesis\]/ \[tesis\]/gi;
		s/\.* *\[disertasi\]/ \[disertasi\]/gi;
		s/\.* *\[dissertation\]/ \[disertasi\]/gi;
		s/\. *skripsi *\./ \[skripsi\]\./gi;
		s/\. *tesis *\./ \[tesis\]\./gi;
		s/\. *thesis *\./ \[tesis\]\./gi;
		s/\. *disertasi *\./ \[disertasi\]\./gi;
		s/\. *dissertation *\./ \[disertasi\]\./gi;
		s/\[skripsi\] \./\[skripsi\]\./g;

		while(/ ([0-9]+-([0-9]+-)*) (-*[0-9]+(-[0-9]+)*)/){
			s/ ([0-9]+-([0-9]+-)*) (-*[0-9]+(-[0-9]+)*)/ $1$3/g;
		}
		s/( [A-Z]) *\. *\, /$1\, /g;
		s/( [A-Z])\. ([A-Z]) /$1 $2/g;
		# s/( [A-Z])\. ([A-Z][A-Za-z]+)/$1 $2/g;
		s/ P[\. ]*T\. ([A-Z][A-Za-z]+)/ PT $1/g;
		s/([^(https*:\/\/)])(\w+)\:(\w+)/$1$2: $3/g;
		s/(\w+) \: (\w+)/$1: $2/g;
		s/(\w+) \:(\w+)/$1: $2/g;
		s/\. Dalam:/\. Di dalam:/gi;
		s/\. Di Dalam:/\. Di dalam:/gi;
		s/\. in:/\. Di dalam:/gi;
		s/\. on /\. Di dalam: /gi;
		s/ \([ ]*eds[\. ]*\) /, editor. /gi;
		s/([ :])([A-Z1-9][0-9]*) *\- *([A-Z1-9][0-9]*)/$1$2\-$3/g;
		s/ hal[\:\. ]+([A-Z0-9][0-9]*\-[A-Z0-9][0-9]*)/ hlm\. $1/gi;
		# s/ hal: ([A-Z0-9][0-9]*\-[A-Z0-9][0-9]*)/ hlm\. $1/gi;
		s/[ \,\.]pp[\. ]+([A-Z0-9][0-9]*)/ hlm\. $1/gi;
		s/[ \,\.]p[\. ]+([0-9][0-9]*\-[0-9][0-9]*)/ hlm\. $1/gi;
		s/ pages[\. ]+([A-Z0-9][0-9]*)/ hlm\. $1/gi;
		s/[ \,\.]h[\. ]+([0-9][0-9]*\-[0-9][0-9]*)/ hlm\. $1/g;
		s/\. hlm\. ([A-Z0-9][0-9]*)/ hlm\. $1/gi;

		s/ Mc\. Graw/ Mc\.Graw/g;
		s/request for comment(s?)/request for comments/gi;
		s/request for comments\. \d+ /request for comments\. /gi;
		s/ ke *\- *(\d*)/ ke\-$1/gi;

		s/(https*:) \/\//$1\/\//g;
		s/(https*)[\.: ]+\/\//$1:\/\//g;
		s/\[(https*:\/\/.+)\]/$1/g;
		while(/(https*:\/\/.+)\. (.+)/){
			s/(https*:\/\/.+)\. (.+)/$1\.$2/g;
		}
		while(/(https*:\/\/.+)\/ (.+)/){
			s/(https*:\/\/.+)\/ (.+)/$1\/$2/g;
		}
		while(/(https*:\/\/.+) \/(.+)/){
			s/(https*:\/\/.+) \/(.+)/$1\/$2/g;
		}
		s/[\w\S](https*:)/ $1/g;
		s/(www\.) (.+)/$1$2/g;
		while(/(www\..+)\. (.+)/){
			s/(www\..+)\. (.+)/$1\.$2/g;
		}
		while(/(www\..+)\/ (.+)/){
			s/(www\..+)\/ (.+)/$1\/$2/g;
		}
		s/(ftp\.) (.+)/$1$2/g;
		while(/(ftp\..+)\. (.+)/){
			s/(ftp\..+)\. (.+)/$1\.$2/g;
		}
		while(/(ftp\..+)\/ (.+)/){
			s/(ftp\..+)\/ (.+)/$1\/$2/g;
		}
		while(/(http(s?):\/\/.+)\. (pdf|txt|html|htm|cfm|ppt)(([ \.]?))/){
			s/(http(s?):\/\/.+)\. (pdf|txt|html|htm|cfm|ppt)(([ \.]?))/$1\.$2$3/gi;
		}
		while(/\/(.+) (.+)(\.pdf|\.txt|\.html|\.htm|\.cfm|\.ppt)(([ \.]?))/){
			s/\/(.+) (.+)(\.pdf|\.txt|\.html|\.htm|\.cfm|\.ppt)(([ \.]?))/\/$1$2$3/gi;
		}
		s/(http(s?):\/\/.+\.)(pdf|txt|html|htm|cfm|ppt)/$1.lc($3)/gei;
		# print $_."\n";

		while(/\. (aero|asia|biz|cat|com|coop|info|int|jobs|mobi|museum|name|net|org|post|pro|tel|travel|xxx|edu|gov|mil|ac|ad|ae|af|ag|ai|al|am|an|ao|aq|ar|as|at|au|aw|ax|az|ba|bb|bd|be|bf|bg|bh|bi|bj|bm|bn|bo|br|bs|bt|bv|bw|by|bz|ca|cc|cd|cf|cg|ch|ci|ck|cl|cm|cn|co|cr|cs|cu|cv|cx|cy|cz|dd|de|dj|dk|dm|do|dz|ec|ee|eg|eh|er|es|et|eu|fi|fj|fk|fm|fo|fr|ga|gb|gd|ge|gf|gg|gh|gi|gl|gm|gn|gp|gq|gr|gs|gt|gu|gw|gy|hk|hm|hn|hr|ht|hu|id|ie|il|im|in|io|iq|ir|is|it|je|jm|jo|jp|ke|kg|kh|ki|km|kn|kp|kr|kw|ky|kz|la|lb|lc|li|lk|lr|ls|lt|lu|lv|ly|ma|mc|md|me|mg|mh|mk|ml|mm|mn|mo|mp|mq|mr|ms|mt|mu|mv|mw|mx|my|mz|na|nc|ne|nf|ng|ni|nl|no|np|nr|nu|nz|om|pa|pe|pf|pg|ph|pk|pl|pm|pn|pr|ps|pt|pw|py|qa|re|ro|rs|ru|rw|sa|sb|sc|sd|se|sg|sh|si|sj|sk|sl|sm|sn|so|sr|ss|st|su|sv|sx|sy|sz|tc|td|tf|tg|th|tj|tk|tl|tm|tn|to|tp|tr|tt|tv|tw|tz|ua|ug|uk|us|uy|uz|va|vc|ve|vg|vi|vn|vu|wf|ws|ye|yt|yu|za|zm|zw|pdf|txt|html|htm|cfm|ppt|php)([\/\. ])/){
			s/\. (aero|asia|biz|cat|com|coop|info|int|jobs|mobi|museum|name|net|org|post|pro|tel|travel|xxx|edu|gov|mil|ac|ad|ae|af|ag|ai|al|am|an|ao|aq|ar|as|at|au|aw|ax|az|ba|bb|bd|be|bf|bg|bh|bi|bj|bm|bn|bo|br|bs|bt|bv|bw|by|bz|ca|cc|cd|cf|cg|ch|ci|ck|cl|cm|cn|co|cr|cs|cu|cv|cx|cy|cz|dd|de|dj|dk|dm|do|dz|ec|ee|eg|eh|er|es|et|eu|fi|fj|fk|fm|fo|fr|ga|gb|gd|ge|gf|gg|gh|gi|gl|gm|gn|gp|gq|gr|gs|gt|gu|gw|gy|hk|hm|hn|hr|ht|hu|id|ie|il|im|in|io|iq|ir|is|it|je|jm|jo|jp|ke|kg|kh|ki|km|kn|kp|kr|kw|ky|kz|la|lb|lc|li|lk|lr|ls|lt|lu|lv|ly|ma|mc|md|me|mg|mh|mk|ml|mm|mn|mo|mp|mq|mr|ms|mt|mu|mv|mw|mx|my|mz|na|nc|ne|nf|ng|ni|nl|no|np|nr|nu|nz|om|pa|pe|pf|pg|ph|pk|pl|pm|pn|pr|ps|pt|pw|py|qa|re|ro|rs|ru|rw|sa|sb|sc|sd|se|sg|sh|si|sj|sk|sl|sm|sn|so|sr|ss|st|su|sv|sx|sy|sz|tc|td|tf|tg|th|tj|tk|tl|tm|tn|to|tp|tr|tt|tv|tw|tz|ua|ug|uk|us|uy|uz|va|vc|ve|vg|vi|vn|vu|wf|ws|ye|yt|yu|za|zm|zw|pdf|txt|html|htm|cfm|ppt|php)([\/\. ])/\.$1$2/g;
		}
		while(/ ([a-z]+)\. ([a-z0-9\.]+)\.(aero|asia|biz|cat|com|coop|info|int|jobs|mobi|museum|name|net|org|post|pro|tel|travel|xxx|edu|gov|mil|ac|ad|ae|af|ag|ai|al|am|an|ao|aq|ar|as|at|au|aw|ax|az|ba|bb|bd|be|bf|bg|bh|bi|bj|bm|bn|bo|br|bs|bt|bv|bw|by|bz|ca|cc|cd|cf|cg|ch|ci|ck|cl|cm|cn|co|cr|cs|cu|cv|cx|cy|cz|dd|de|dj|dk|dm|do|dz|ec|ee|eg|eh|er|es|et|eu|fi|fj|fk|fm|fo|fr|ga|gb|gd|ge|gf|gg|gh|gi|gl|gm|gn|gp|gq|gr|gs|gt|gu|gw|gy|hk|hm|hn|hr|ht|hu|id|ie|il|im|in|io|iq|ir|is|it|je|jm|jo|jp|ke|kg|kh|ki|km|kn|kp|kr|kw|ky|kz|la|lb|lc|li|lk|lr|ls|lt|lu|lv|ly|ma|mc|md|me|mg|mh|mk|ml|mm|mn|mo|mp|mq|mr|ms|mt|mu|mv|mw|mx|my|mz|na|nc|ne|nf|ng|ni|nl|no|np|nr|nu|nz|om|pa|pe|pf|pg|ph|pk|pl|pm|pn|pr|ps|pt|pw|py|qa|re|ro|rs|ru|rw|sa|sb|sc|sd|se|sg|sh|si|sj|sk|sl|sm|sn|so|sr|ss|st|su|sv|sx|sy|sz|tc|td|tf|tg|th|tj|tk|tl|tm|tn|to|tp|tr|tt|tv|tw|tz|ua|ug|uk|us|uy|uz|va|vc|ve|vg|vi|vn|vu|wf|ws|ye|yt|yu|za|zm|zw)([\/\. ])/){
			s/ ([a-z]+)\. ([a-z0-9\.]+)\.(aero|asia|biz|cat|com|coop|info|int|jobs|mobi|museum|name|net|org|post|pro|tel|travel|xxx|edu|gov|mil|ac|ad|ae|af|ag|ai|al|am|an|ao|aq|ar|as|at|au|aw|ax|az|ba|bb|bd|be|bf|bg|bh|bi|bj|bm|bn|bo|br|bs|bt|bv|bw|by|bz|ca|cc|cd|cf|cg|ch|ci|ck|cl|cm|cn|co|cr|cs|cu|cv|cx|cy|cz|dd|de|dj|dk|dm|do|dz|ec|ee|eg|eh|er|es|et|eu|fi|fj|fk|fm|fo|fr|ga|gb|gd|ge|gf|gg|gh|gi|gl|gm|gn|gp|gq|gr|gs|gt|gu|gw|gy|hk|hm|hn|hr|ht|hu|id|ie|il|im|in|io|iq|ir|is|it|je|jm|jo|jp|ke|kg|kh|ki|km|kn|kp|kr|kw|ky|kz|la|lb|lc|li|lk|lr|ls|lt|lu|lv|ly|ma|mc|md|me|mg|mh|mk|ml|mm|mn|mo|mp|mq|mr|ms|mt|mu|mv|mw|mx|my|mz|na|nc|ne|nf|ng|ni|nl|no|np|nr|nu|nz|om|pa|pe|pf|pg|ph|pk|pl|pm|pn|pr|ps|pt|pw|py|qa|re|ro|rs|ru|rw|sa|sb|sc|sd|se|sg|sh|si|sj|sk|sl|sm|sn|so|sr|ss|st|su|sv|sx|sy|sz|tc|td|tf|tg|th|tj|tk|tl|tm|tn|to|tp|tr|tt|tv|tw|tz|ua|ug|uk|us|uy|uz|va|vc|ve|vg|vi|vn|vu|wf|ws|ye|yt|yu|za|zm|zw)\// $1\.$2\.$3\//g;
		}

		s/\s\s+/ /g;
		s/[\. ]et[\. ]+al[\. ]/, et al\./g;
		s/(\. [1-9][0-9]{3})\.([A-Za-z0-9]+)/$1\. $2/g;
		s/([1-9][0-9]{3})\.([0-9]+-)/$1\. $2/g;
		s/([A-Za-z])\.([1-9][0-9]{3})\. /$1\. $2\. /g;
		s/([1-9][0-9]*) *\(([1-9][0-9]*)\) *: *(.+)/ $1\($2\):$3/g;
		s/([1-9][0-9]*) *\(([1-9][0-9]*)\)/$1\($2\)/g;
		s/\. \)/\.\)/g;
		s/\((.*)\. (.+)\)/\($1\.$2\)/g;
		s/\. *\[[\w ]+\]\./\./g;
		s/\. *\[[\w ]+\] / /g;
		s/(\".+)\. (.+\")/$1\, $2/g;
		s/\"(.+)\"/$1/g;
		s/\. ([a-z]+) / $1 /g;
		s/( [A-Z]\.) ([A-Z])\. ([A-Z]) /$1 $2 $3 /g;
		s/ ([A-Z])\. ([A-Z]\.) / $1 $2 /g;
		s/ ([A-Z])\. ([A-Z]) / $1 $2 /g;
		s/ ([A-Z])\. ([A-Z\&][\, ])/ $1 $2/g;
		s/ ([A-Z])\. ([A-Z][a-z]+[\.\,])/ $1 $2/g;
		while (/[\s\S]([A-Z])\.([A-Z])([\S\s])/){
			s/[\s\S]([A-Z])\.([A-Z])([\S\s])/ $1 $2$3/g;
		}
		# s/([A-Za-z]+)\.([A-Za-z])\./$1 $2\./g;
		s/\.([A-Z][A-Za-z]+) /\. $1 /g;
		s/(\W) [\.\,\:\;] /$1 /g;
		s/(.+) \.([ \w])/$1\. $2/g;
		s/\`/\'/g;

		s/Ph\. D/Ph\.D/g;
		s/Ph\. D\./Ph\.D/g;
		s/Ph\.D\./Ph\.D/g;
		s/Visual Basic\. Net/Visual Basic\.Net/gi;
		s/ pen(t?)erjemah[:;] / penerjemah\. /gi;
		s/\s\s+/ /g;
		s/\s\s+\.$/\./g;
#		next if length $_ > 200;
		push @refs_out, $_;
	}
	# foreach (@refs_out)
	# {
	# 	print $_."\n";
	# }exit;
	# print Dumper(@refs_out);exit;
	return @refs_out;

}

# Private method to determine if/where columns are present.

sub _decolumnise 
{
	my($self, @lines) = @_;
	my @bitsout;
	my @lens = (0); # Removes need to check $lens[0] is defined
	foreach(@lines)
	{
		# Replaces tabs with 8 spaces
		s/\t/        /g;
		# Ignore lines that are >75% whitespace (probably diagrams/equations)
		next if( length($_) == 0 || (($_ =~ tr/ //)/length($_)) > .75 );
		# Split into characters
		my @bits = unpack "c*", $_;
		# Count lines together that vary slightly in length (within 5 chars)
		$lens[int(scalar @bits/5)*5+2]++;
		my @newbits = map { $_ = ($_==32?1:0) } @bits;
		for(my $i=0; $i<$#newbits; $i++) { $bitsout[$i]+=$newbits[$i]; } 
	}
	# Calculate the average length based on the modal.
	# 2003-05-14 Fixed by tdb
	my $avelen = 0;
	for(my $i = 0; $i < @lens; $i++ ) {
		next unless defined $lens[$i];
		$avelen = $i if $lens[$i] > $lens[$avelen];
	}
	my $maxpoint = 0;
	my $max = 0;
	# Determine which point has the most spaces
	for(my $i=0; $i<$#bitsout; $i++) { if ($bitsout[$i] > $max) { $max = $bitsout[$i]; $maxpoint = $i; } }
	my $center = int($avelen/2);
	my $output = 0;
	# Only accept if the max point lies around the average center.
	if ($center-6 <= $maxpoint && $center+6>= $maxpoint) { $output = $maxpoint; } else  {$output = 0;}
#warn "Decol: avelen=$avelen, center=$center, maxpoint=$maxpoint (output=$output)\n";
	return ($output, $avelen); 
}

# Private function that replaces header/footers with form feeds

sub _addpagebreaks {
	my $doc = shift;
	return $doc if $doc =~ /\f/s;
	my %HEADERS;

	while( $doc =~ /(?:\n[\r[:blank:]]*){2}([^\n]{0,40}\w+[^\n]{0,40})(?:\n[\r[:blank:]]*){3}/osg ) {
		$HEADERS{_header_to_regexp($1)}++;
	}

	if( %HEADERS ) {
		my @regexps = sort { $HEADERS{$b} <=> $HEADERS{$a} } keys %HEADERS;
		my $regexp = $regexps[0];
		if( $HEADERS{$regexp} > 3 ) {
			my $c = $doc =~ s/(?:\n[\r[:blank:]]*){2}(?:$regexp)(?:\n[\r[:blank:]]*){3}/\f/sg;
#			warn "Applying regexp: $regexp ($HEADERS{$regexp} original matches) Removed $c header/footers using ($HEADERS{$regexp} original matches): $regexp\n";
		} else {
			warn "Not enough matching header/footers were found ($HEADERS{$regexp} only)";
		}
	} else {
		warn "Header/footers not found - flying blind if this is a multi-column document";
	}

	return $doc;
}

sub _header_to_regexp {
	my $header = shift;
	$header =~ s/([\\\|\(\)\[\]\.\*\+\?\{\}])/\\$1/g;
	$header =~ s/\s+/\\s+/g;
	$header =~ s/\d+/\\d+/g;
	return $header;
}

sub _within {
	my ($l,$r,$p) = @_;
#warn "Is $l with $p of $r?\n";
	return $r >= $l-$p && $r <= $l+$p;
}

sub trim($)
{
	my $string = shift;
	$string =~ s/^\s+//;
	$string =~ s/\s+$//;
	return $string;
}
sub merge_ref{
	my ($curr_ref,$tmp) = @_;
	if ($curr_ref =~/http:\/\/.*$/) {
		$curr_ref = trim($curr_ref);
		$tmp = trim($tmp);
		$curr_ref = $curr_ref.$tmp;
	}else {
		$tmp=~ s/\./\. /g;
		while ($tmp=~ /(http:\/\/.+)\. (\w+)/){
			$tmp=~ s/(http:\/\/.+)\. (\w+)/$1\.$2/g;
		}
		$tmp=~ s/(Proceeding |Proceding )/Proceedings /g;
		$curr_ref .= " ".$tmp;
	}
	return $curr_ref;
}

sub strpos
{
	my($f, $s) = @_;
	# print $s."\n";
	$f =~ m/($s)/g;
	if($1){
		my $pos = pos($f) - length $1;
		return $pos;
	}else{
		return -1;
	}
}

1;

__END__

=back

=pod

=head1 CHANGES

- 2003/05/13
	Removed Perl warnings generated from parse() by adding checks on the regexps

=head1 AUTHOR

Mike Jewell <moj@ecs.soton.ac.uk>
Tim Brody <tdb01r@ecs.soton.ac.uk>

=cut
