package Biblio::Citation::Parser::Templates;

######################################################################
#
# Biblio::Citation::Parser::Templates;
#
######################################################################
#
#  This file is part of ParaCite Tools (http://paracite.eprints.org/developers/)
#
#  Copyright (c) 2004 University of Southampton, UK. SO17 1BJ.
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


=pod

=head1 NAME

Biblio::Citation::Parser::Templates - citation templates collection

=head1 DESCRIPTION

This package contains a list of templates that are
used to parse citations. Updates will be made available at
http://paracite.eprints.org/developers/ (hopefully with a merging tool to
ensure you don't lose any changes). To add new fields, edit Standard.pm.

=cut

$Biblio::Citation::Parser::Templates::templates = [

	# PROSIDING, WORKSHOP
	'_AUTHORS_. _YEAR_. _TITLE_. Proceedings of _PUBLOC_. _PUBLISHER_.',
	'_AUTHORS_. _YEAR_. _TITLE_. Proceedings of _PUBLISHER_. ISSN _ISSN_.',
	'_AUTHORS_. _YEAR_. _TITLE_. Proceedings of _PUBLISHER_ Workshop on _PUBLOC_. _PAGES_.',
	'_AUTHORS_. _YEAR_. _TITLE_. _PUBLISHER_ Workshop on _PUBLOC_. _PAGES_.',

	#MAKALAH, JOURNAL
	'_AUTHORS_. _YEAR_. _TITLE_. Journal of _PUBLISHER_. _VOLUME_(_ISSUE_):_PAGES_.',
	'_AUTHORS_. _YEAR_. _TITLE_. Journal of _PUBLISHER_. _VOLUME_(_ISSUE_).',
	'_AUTHORS_. _YEAR_. _TITLE_. Journal of _PUBLISHER_. _VOLUME_. _PAGES_.',
	'_AUTHORS_. _YEAR_. _TITLE_. Journal of _PUBLISHER_. _VOLUME_.',
	'_AUTHORS_. _YEAR_. _TITLE_. _PUBLISHER_. _VOLUME_(_ISSUE_):_PAGES_.',
	'_AUTHORS_. _YEAR_. _TITLE_. _PUBLISHER_. _VOLUME_(_ISSUE_). _PAGES_.',
	'_AUTHORS_. _YEAR_. _TITLE_. _PUBLISHER_. _VOLUME_(_ISSUE_).',
	'_AUTHORS_. _YEAR_. _TITLE_. _PUBLISHER_. _VOLUME_. _PAGES_.',
	'_AUTHORS_. _YEAR_. _TITLE_. _PUBLISHER_. _VOLUME_:_PAGES_.',
	'_AUTHORS_. _YEAR_. _TITLE_. _PUBLISHER_. _VOLUME_.',
	'_AUTHORS_. _YEAR_. _TITLE_. _PUBLISHER_. _PAGES_.',

	#SKRIPSI, TESIS, DISERTASI
	'_AUTHORS_. _YEAR_. _TITLE_ [skripsi]. _PUBLOC_. _PUBLISHER_.',
	'_AUTHORS_. _YEAR_. _TITLE_ [skripsi]. _PUBLOC_: _PUBLISHER_.',
	'_AUTHORS_. _YEAR_. _TITLE_ [tesis]. _PUBLOC_. _PUBLISHER_.',
	'_AUTHORS_. _YEAR_. _TITLE_ [tesis]. _PUBLOC_: _PUBLISHER_.',
	'_AUTHORS_. _YEAR_. _TITLE_ [disertasi]. _PUBLOC_. _PUBLISHER_.',
	'_AUTHORS_. _YEAR_. _TITLE_ [disertasi]. _PUBLOC_: _PUBLISHER_.',

	#WEBSITE 
	'_AUTHORS_. _YEAR_. _TITLE_. _PUBLISHER_. _URL_ [_ANY_]',
	'_AUTHORS_. _YEAR_. _TITLE_. _URL_ [_ANY_]',

	#BUKU
	'_AUTHORS_. _YEAR_. _TITLE_. _PUBLICATION_. _PUBLISHER_.',
	'_AUTHORS_. _YEAR_. _TITLE_. _PUBLICATION_. _PUBLISHER_. _PUBLOC_.',
	'_AUTHORS_. _YEAR_. _TITLE_. _PUBLISHER_. _PUBLOC_.',
	'_AUTHORS_. _YEAR_. _TITLE_. _PUBLOC_:_PUBLISHER_.',


	'_AUTHORS_. _YEAR_. _TITLE_. _PUBLISHER_. _PAGES_.',
	'_AUTHORS_. _YEAR_. _TITLE_. _PUBLISHER_. _ANY_.',

	'_AUTHORS_. _YEAR_. _TITLE_. _PUBLISHER_.',
	'_AUTHORS_. _YEAR_. _TITLE_. _PUBLISHER_. _PUBLOC_.',
	'_AUTHORS_. _YEAR_. _TITLE_.'
];

1;


__END__

=pod

=head1 AUTHOR

Mike Jewell <moj@ecs.soton.ac.uk>

=cut
