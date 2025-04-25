const { execFile } = require( "node:child_process" );
const fs = require( "node:fs" );
const path = require( "node:path" );
const process = require( "node:process" );

const OUTPUT_JSON_PATH = ".\\ClientLicense.json";
const OUTPUT_MD_PATH = ".\\LICENSE_THIRD_PARTIES.md";

const MD_HEADER_FIRST_SEPARATOR = "=";
const MD_HEADER_SECOND_SEPARATOR = "-";

const MD_LINE_ENDING = "\n";
const NEW_LINE_BREAKERS = [ "\r\n", "\n", "\r" ];

ProcessPackages( true );

function ProcessPackages( onlyProd )
{
	execFile( process.platform.startsWith( "win" ) ? "pnpm.cmd" : "pnpm", [ "licenses", "list", "--json", "--long", onlyProd ? "-P" : "-D" ], { shell: true }, ( error, stdout, stderr ) =>
	{
		if( error || stderr )
		{
			console.error( error, stderr ); // eslint-disable-line no-console
		}
		else
		{
			try
			{
				const data = JSON.parse( stdout );
				FormatJson( onlyProd, data );
				WriteOutputMD( data );
			}
			catch( e )
			{
				console.error( e ); // eslint-disable-line no-console
			}
		}
	} );
}

function FormatJson( onlyProd, data )
{
	const packages = [];
	const result = { Packages: packages };
	Object.keys( data ).forEach( ( licenseType ) =>
	{
		const array = data[ licenseType ];
		for( const fPackIndex in array )
		{
			const fPackage = array[ fPackIndex ];
			for( const i in fPackage.versions )
			{
				const packInfo = {
					Name: fPackage.name.slice( fPackage.name.startsWith( "@" ) ? 1 : 0 ), Version: fPackage.versions[ i ], Authors: fPackage.author, Homepage: fPackage.homepage, LicenseType: fPackage.license, LicenseOriginal: GetLicenceFile( fPackage.paths[ i ] ),
				};
				packages.push( packInfo );
			}
		}
	} );

	// Sort by Name
	packages.sort( ( left, right ) =>
	{
		return left.Name < right.Name ? -1 : left.Name > right.Name ? 1 : 0;
	} );

	let fileContent = JSON.stringify( result, null, "\t" );
	fileContent += "\n";

	fs.writeFileSync( OUTPUT_JSON_PATH, fileContent, "utf-8" );
}

function GetLicenceFile( packagePath )
{
	const licenseFileNames = [ "LICENSE", "LICENCE", "COPYING" ];
	let licenseFileContent = undefined;

	for( const i in licenseFileNames )
	{
		const regex = new RegExp( `${ licenseFileNames[ i ] }.*?`, "i" );
		fs.readdirSync( packagePath ).some( file =>
		{
			const match = file.match( regex );
			if( match )
			{
				// console.log( "L: ", path.join( packagePath, file ) );
				licenseFileContent = fs.readFileSync( path.join( packagePath, file ) ).toString();
			}

			return match;
		} );

		if( licenseFileContent )
		{
			break;
		}
	}

	if( !licenseFileContent )
	{
		console.error( `FILE NOT FOUND: ${ packagePath }` ); // eslint-disable-line no-console
	}
	return licenseFileContent;
}

function WriteOutputMD( data )
{
	let result = "";
	result = WriteHeaderMD( result, "Third party licenses", MD_HEADER_FIRST_SEPARATOR );
	result = WriteParagraphMD( result, "*This software stands on the shoulders of the following giants:*" );
	result = WriteLineMD( result );

	Object.keys( data ).forEach( ( licenseType ) =>
	{
		const array = data[ licenseType ];
		for( const fPackIndex in array )
		{
			const fPackage = array[ fPackIndex ];
			for( const i in fPackage.versions )
			{
				result = WriteHeaderMD( result, `${ fPackage.name.slice( fPackage.name.startsWith( "@" ) ? 1 : 0 ) } [${ fPackage.versions[ i ] }]`, MD_HEADER_SECOND_SEPARATOR, 1 );

				if( fPackage.homepage )
				{
					result = WriteParagraphMD( result, `Homepage: <${ fPackage.homepage }>`, 1 );
				}

				if( fPackage.author )
				{
					result = WriteParagraphMD( result, `Authors: ${ fPackage.author }`, 1 );
				}

				result = WriteLineMD( result, "License:", 1 );

				const licenseFile = GetLicenceFile( fPackage.paths[ i ] );
				if( licenseFile )
				{
					result = WriteComplexMD( result, licenseFile, 2 );
				}
				else
				{
					result = WriteLineMD( result, fPackage.license, 2 );
				}

				result = WriteLineMD( result, undefined, 1 );
				result = WriteLineMD( result );

				const packInfo = {
					Name: fPackage.name.slice( fPackage.name.startsWith( "@" ) ? 1 : 0 ), Version: fPackage.versions[ i ], Authors: fPackage.author, Homepage: fPackage.homepage, LicenseType: fPackage.license, LicenseOriginal: GetLicenceFile( fPackage.paths[ i ] ),
				};
			}
		}
	} );

	fs.writeFileSync( OUTPUT_MD_PATH, result, "utf-8" );
}

function WriteHeaderMD( result, text, headerSeparator, indentation = 0 )
{
	result = WriteLineMD( result, text, indentation );
	result = WriteLineMD( result, headerSeparator.repeat( text.length ), indentation );
	result = WriteLineMD( result, undefined, indentation );

	return result;
}

function WriteComplexMD( result, text, indentation = 0 )
{
	const lines = text.split( /\r?\n/ );
	lines.forEach( ( line ) => result = WriteLineMD( result, line, indentation ) );

	return result;
}

function WriteParagraphMD( result, text, indentation = 0 )
{
	result = WriteLineMD( result, text, indentation );
	result = WriteLineMD( result, undefined, indentation );

	return result;
}

function WriteLineMD( result, text = undefined, indentation = 0 )
{
	result = WriteIndentationMD( result, text, indentation );
	if( text )
	{
		result += text;
	}
	result += MD_LINE_ENDING;

	return result;
}

function WriteIndentationMD( result, text, indentation )
{
	if( indentation > 0 )
	{
		result += ">".repeat( indentation );
		if( text )
		{
			result += " ";
		}
	}

	return result;
}