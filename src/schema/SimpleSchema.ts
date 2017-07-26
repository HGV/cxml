import { TokenKind } from '../parser/Token';
import { ParserConfig } from '../parser/ParserConfig';
import { Namespace } from '../Namespace';
import { ComplexType } from './ComplexType';
import { SimpleType } from './Member';
import { AttributeSpec, AttributeDetail } from './Attribute';
import { SimpleElementSpec, SimpleElementDetail, ElementSpec, ElementDetail } from './Element';

export type SimpleMemberSpec = string | { [ memberName: string]: string };

export type SimpleSchemaSpec = { [ typeName: string ]: SimpleMemberSpec[] };

export class SimpleSchema {

	constructor(private parserConfig: ParserConfig, public ns: Namespace, spec: SimpleSchemaSpec, root = spec['document']) {
		const typeTbl = this.typeTbl;

		const stringType = new SimpleType();
		typeTbl['xs:string'] = stringType;

		parserConfig.addNamespace(ns);

		// Create placeholder objects for all types.
		for(let typeName of Object.keys(spec)) {
			typeTbl[typeName] = new ComplexType();
		}

		// Define types, using placeholders when referring to undefined types.
		for(let typeName of Object.keys(spec)) {
			this.defineType(spec[typeName], typeTbl[typeName] as ComplexType);
		}

		this.document = (typeTbl['document'] || this.defineType(root)) as ComplexType;
	}

	defineType(spec: SimpleMemberSpec[], type: ComplexType = new ComplexType()) {
		let memberName: string;

		for(let child of spec) {
			if(typeof(child) == 'string') {
				memberName = child;
				child = {};
				child[memberName] = memberName;
			}

			for(memberName of Object.keys(child)) {
				let min = 1, max = 1;

				// Parse element or attribute name with type prefix / suffix.
				let parts = memberName.match(/(\$?)([^\[]+)(\?)?(\[\])?/);
				if(!parts) continue;

				let [, prefix, name, optionalSuffix, arraySuffix] = parts;

				// Parse type name if it differs from element/attribute name.
				if(child[memberName] != memberName) {
					parts = child[memberName].match(/(\$?)([^\[]+)(\?)?(\[\])?/);
					if(!parts) continue;

					// Type prefix / suffix behave identically in member and type names.
					prefix = prefix || parts[1];
					optionalSuffix = optionalSuffix || parts[3];
					arraySuffix = arraySuffix || parts[4];
				}

				if(optionalSuffix) min = 0;
				if(arraySuffix) max = Infinity;

				const memberTypeName = parts[2];
				const memberType = this.typeTbl[memberTypeName];

				// Prefix $ marks attributes.
				if(prefix == '$') {
					const token = this.parserConfig.getAttributeTokens(this.ns, name)[TokenKind.string]!;
					const attributeSpec = new AttributeSpec(min, max);
					const attributeDetail = new AttributeDetail(token);

					// attributeDetail.type = xsd:string
					attributeSpec.detail = attributeDetail;
					type.addAttribute(attributeSpec);
				} else if(memberType) {
					const token = this.parserConfig.getElementTokens(this.ns, name)[TokenKind.open]!;
					let elementSpec: SimpleElementSpec | ElementSpec;
					let elementDetail: SimpleElementDetail | ElementDetail;

					if(memberType instanceof ComplexType) {
						elementSpec = new ElementSpec(min, max);
						elementDetail = new ElementDetail(token);
					} else {
						elementSpec = new SimpleElementSpec(min, max);
						elementDetail = new SimpleElementDetail(token);
					}

					elementDetail.type = memberType;
					elementSpec.detail = elementDetail;
					type.addAll(elementSpec);
				}
			}
		}

		return(type);
	}

	typeTbl: { [ typeName: string ]: SimpleType | ComplexType } = {};

	document: ComplexType;

}