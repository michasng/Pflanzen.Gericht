import { describe, it, expect } from 'vitest'
import { INGREDIENT_LANGUAGE_DE, INGREDIENT_LANGUAGE_EN } from '../ingredientLanguages.js'
import { parseIngredientsText } from '../parseIngredientsText.js'

describe('parseIngredientsText', () => {
  it('given the german oat drink example, parses names, percent and organic markers, keeping bracketed qualifiers on the ingredient', () => {
    const text =
      'Wasser, HAFER* 10%, Rapsöl*, Meersalz, Säureregulator (Kaliumcarbonat). Ökologische Zutaten.'

    expect(parseIngredientsText(text, INGREDIENT_LANGUAGE_DE)).toEqual([
      { name: 'Wasser', fractionBasisPoints: null },
      { name: 'HAFER (Bio)', fractionBasisPoints: 1000 },
      { name: 'Rapsöl (Bio)', fractionBasisPoints: null },
      { name: 'Meersalz', fractionBasisPoints: null },
      { name: 'Säureregulator (Kaliumcarbonat)', fractionBasisPoints: null },
    ])
  })

  it('given the same list in english, parses it identically using english organic keywords', () => {
    const text =
      'Water, OAT* 10%, rapeseed oil, sea salt, acidity regulator (potassium carbonate). \r\n\r\n*Organic ingredients.'

    expect(parseIngredientsText(text, INGREDIENT_LANGUAGE_EN)).toEqual([
      { name: 'Water', fractionBasisPoints: null },
      { name: 'OAT (Bio)', fractionBasisPoints: 1000 },
      { name: 'rapeseed oil', fractionBasisPoints: null },
      { name: 'sea salt', fractionBasisPoints: null },
      {
        name: 'acidity regulator (potassium carbonate)',
        fractionBasisPoints: null,
      },
    ])
  })

  it('given a name is all-caps to denote an allergen, keeps the casing unchanged', () => {
    const text = 'Wasser, HAFER 10%'

    expect(parseIngredientsText(text, INGREDIENT_LANGUAGE_DE)).toEqual([
      { name: 'Wasser', fractionBasisPoints: null },
      { name: 'HAFER', fractionBasisPoints: 1000 },
    ])
  })

  it('given the text mentions the organic keyword case-insensitively, still marks starred ingredients as organic', () => {
    const text = 'Wasser, Hafer* 5%. BIO.'

    expect(parseIngredientsText(text, INGREDIENT_LANGUAGE_DE)).toEqual([
      { name: 'Wasser', fractionBasisPoints: null },
      { name: 'Hafer (Bio)', fractionBasisPoints: 500 },
    ])
  })

  it('given an ingredient contains bio in the ingredient list, does not treat it as the organic footnote', () => {
    const text = 'Wasser, Hafer* 5%, Biotin.'

    expect(parseIngredientsText(text, INGREDIENT_LANGUAGE_DE)).toEqual([
      { name: 'Wasser', fractionBasisPoints: null },
      { name: 'Hafer', fractionBasisPoints: 500 },
      { name: 'Biotin', fractionBasisPoints: null },
    ])
  })

  it('given no organic keyword is present in the text, does not mark starred ingredients as organic', () => {
    const text = 'Wasser, Hafer* 5%.'

    expect(parseIngredientsText(text, INGREDIENT_LANGUAGE_DE)).toEqual([
      { name: 'Wasser', fractionBasisPoints: null },
      { name: 'Hafer', fractionBasisPoints: 500 },
    ])
  })

  it('given a bracketed qualifier follows an ingredient, keeps it as a single ingredient name', () => {
    const text = 'Regulator (Kaliumcarbonat, Natriumcarbonat)'

    expect(parseIngredientsText(text, INGREDIENT_LANGUAGE_DE)).toEqual([
      {
        name: 'Regulator (Kaliumcarbonat, Natriumcarbonat)',
        fractionBasisPoints: null,
      },
    ])
  })

  it('given the text has no trailing sentence, still parses the ingredient list', () => {
    const text = 'Wasser, Zucker'

    expect(parseIngredientsText(text, INGREDIENT_LANGUAGE_DE)).toEqual([
      { name: 'Wasser', fractionBasisPoints: null },
      { name: 'Zucker', fractionBasisPoints: null },
    ])
  })

  it('given an ingredient uses a decimal percentage, keeps the decimal part', () => {
    const text = 'Wasser, Hafer 2.5%.'

    expect(parseIngredientsText(text, INGREDIENT_LANGUAGE_DE)).toEqual([
      { name: 'Wasser', fractionBasisPoints: null },
      { name: 'Hafer', fractionBasisPoints: 250 },
    ])
  })

  describe('given the end of the ingredient list', () => {
    it('when a period follows, ends the list there', () => {
      expect(parseIngredientsText('Hafer, Salz. Rest', INGREDIENT_LANGUAGE_DE)).toEqual([
        { name: 'Hafer', fractionBasisPoints: null },
        { name: 'Salz', fractionBasisPoints: null },
      ])
    })

    it('when a blank line follows, ends the list there', () => {
      expect(parseIngredientsText('Hafer, Salz\n\nRest, Rest', INGREDIENT_LANGUAGE_DE)).toEqual([
        { name: 'Hafer', fractionBasisPoints: null },
        { name: 'Salz', fractionBasisPoints: null },
      ])
    })

    it('when a blank line containing whitespace follows, ends the list there', () => {
      expect(parseIngredientsText('Hafer, Salz \n \nRest, Rest', INGREDIENT_LANGUAGE_DE)).toEqual([
        { name: 'Hafer', fractionBasisPoints: null },
        { name: 'Salz', fractionBasisPoints: null },
      ])
    })

    it('when a single newline wraps the list, continues the list', () => {
      expect(parseIngredientsText('Hafer, 12% \nSalz, Zucker', INGREDIENT_LANGUAGE_DE)).toEqual([
        { name: 'Hafer', fractionBasisPoints: null },
        { name: 'Salz', fractionBasisPoints: 1200 },
        { name: 'Zucker', fractionBasisPoints: null },
      ])
    })

    it('when an organic footnote follows on the same line, ends the list and marks starred ingredients as organic', () => {
      expect(parseIngredientsText('Hafer*, Salz *aus Bio, Rest', INGREDIENT_LANGUAGE_DE)).toEqual([
        { name: 'Hafer (Bio)', fractionBasisPoints: null },
        { name: 'Salz', fractionBasisPoints: null },
      ])
    })

    it('when an organic footnote follows on the next line, ends the list and marks starred ingredients as organic', () => {
      expect(parseIngredientsText('Hafer*, Salz*\n*aus Bio, Rest', INGREDIENT_LANGUAGE_DE)).toEqual(
        [
          { name: 'Hafer (Bio)', fractionBasisPoints: null },
          { name: 'Salz (Bio)', fractionBasisPoints: null },
        ],
      )
    })

    it('when an equals footnote follows, ends the list and marks starred ingredients as organic', () => {
      expect(
        parseIngredientsText('Hafer*, Salz\n*= aus Bio, Rest', INGREDIENT_LANGUAGE_DE),
      ).toEqual([
        { name: 'Hafer (Bio)', fractionBasisPoints: null },
        { name: 'Salz', fractionBasisPoints: null },
      ])
    })

    it('when ingredients are prefixed with an asterisk, does not treat them as a footnote', () => {
      expect(parseIngredientsText('*Hafer, *Salz', INGREDIENT_LANGUAGE_DE)).toEqual([
        { name: 'Hafer', fractionBasisPoints: null },
        { name: 'Salz', fractionBasisPoints: null },
      ])
    })

    it('when an asterisk prefixes an ingredient after a semicolon or class prefix, does not treat it as a footnote', () => {
      expect(
        parseIngredientsText(
          'Zucker; *Datteln, Emulgator: *Lecithin, Salz',
          INGREDIENT_LANGUAGE_DE,
        ),
      ).toEqual([
        { name: 'Zucker', fractionBasisPoints: null },
        { name: 'Datteln', fractionBasisPoints: null },
        { name: 'Emulgator: Lecithin', fractionBasisPoints: null },
        { name: 'Salz', fractionBasisPoints: null },
      ])
    })

    it('when an asterisk precedes a percentage, does not treat it as a footnote', () => {
      expect(parseIngredientsText('Hafer *10%, Salz', INGREDIENT_LANGUAGE_DE)).toEqual([
        { name: 'Hafer', fractionBasisPoints: 1000 },
        { name: 'Salz', fractionBasisPoints: null },
      ])
    })

    it('when a footnote follows a comma on the next line, ends the list there', () => {
      expect(parseIngredientsText('Hafer*, Salz, \n*aus Bio', INGREDIENT_LANGUAGE_DE)).toEqual([
        { name: 'Hafer (Bio)', fractionBasisPoints: null },
        { name: 'Salz', fractionBasisPoints: null },
      ])
    })

    it('when a footnote with another marker follows, ends the list there', () => {
      expect(
        parseIngredientsText('Hafer°, Salz °Hafer ist Getreide', INGREDIENT_LANGUAGE_DE),
      ).toEqual([
        { name: 'Hafer', fractionBasisPoints: null },
        { name: 'Salz', fractionBasisPoints: null },
      ])
    })

    it('when a bullet follows, ends the list there', () => {
      expect(parseIngredientsText('Hafer, Salz • Rest', INGREDIENT_LANGUAGE_DE)).toEqual([
        { name: 'Hafer', fractionBasisPoints: null },
        { name: 'Salz', fractionBasisPoints: null },
      ])
    })

    it('when a trace notice follows without a period, ends the list there', () => {
      expect(
        parseIngredientsText(
          'Hafer, Salz Kann Spuren von Nüssen enthalten',
          INGREDIENT_LANGUAGE_DE,
        ),
      ).toEqual([
        { name: 'Hafer', fractionBasisPoints: null },
        { name: 'Salz', fractionBasisPoints: null },
      ])
    })

    it('when an allergen notice follows on the next line, ends the list there', () => {
      expect(
        parseIngredientsText(
          'Hafer, Pfeffer\nenthält folgende allergene Zutaten: Senf',
          INGREDIENT_LANGUAGE_DE,
        ),
      ).toEqual([
        { name: 'Hafer', fractionBasisPoints: null },
        { name: 'Pfeffer', fractionBasisPoints: null },
      ])
    })

    it('when a claim follows after a trailing comma on the next line, ends the list there', () => {
      expect(
        parseIngredientsText(
          'Aroma, Meersalz, \nVon Natur aus laktose- und glutenfrei.',
          INGREDIENT_LANGUAGE_DE,
        ),
      ).toEqual([
        { name: 'Aroma', fractionBasisPoints: null },
        { name: 'Meersalz', fractionBasisPoints: null },
      ])
    })

    it('when the statement starts with a list end keyword, does not end the list before it began', () => {
      expect(parseIngredientsText(' Enthält Kichererbsen, Salz', INGREDIENT_LANGUAGE_DE)).toEqual([
        { name: 'Enthält Kichererbsen', fractionBasisPoints: null },
        { name: 'Salz', fractionBasisPoints: null },
      ])
    })

    it.each(['Hinweis', 'Warnung', 'Allergenhinweis'])(
      'when a remark starting with %s follows, ends the list there',
      (keyword) => {
        expect(
          parseIngredientsText(`Hafer, Salz ${keyword}: Rest, Rest`, INGREDIENT_LANGUAGE_DE),
        ).toEqual([
          { name: 'Hafer', fractionBasisPoints: null },
          { name: 'Salz', fractionBasisPoints: null },
        ])
      },
    )

    it('when a keyword is only part of a word, continues the list', () => {
      expect(parseIngredientsText('Hafer, Kannenwasser', INGREDIENT_LANGUAGE_DE)).toEqual([
        { name: 'Hafer', fractionBasisPoints: null },
        { name: 'Kannenwasser', fractionBasisPoints: null },
      ])
    })

    it('when a period follows a vitamin name, ends the list there', () => {
      expect(parseIngredientsText('Hafer, Vitamin B12. Rest', INGREDIENT_LANGUAGE_DE)).toEqual([
        { name: 'Hafer', fractionBasisPoints: null },
        { name: 'Vitamin B12', fractionBasisPoints: null },
      ])
    })

    it('when a period is inside brackets, continues the list', () => {
      expect(
        parseIngredientsText('Kulturen (S. thermophilus), Salz', INGREDIENT_LANGUAGE_DE),
      ).toEqual([
        { name: 'Kulturen (S. thermophilus)', fractionBasisPoints: null },
        { name: 'Salz', fractionBasisPoints: null },
      ])
    })

    it('when a period ends an abbreviation, continues the list', () => {
      expect(
        parseIngredientsText('Weinsäure u. Citronensäure, Salz', INGREDIENT_LANGUAGE_DE),
      ).toEqual([
        { name: 'Weinsäure u. Citronensäure', fractionBasisPoints: null },
        { name: 'Salz', fractionBasisPoints: null },
      ])
    })

    it('when a period ends a species abbreviation, continues the list', () => {
      expect(
        parseIngredientsText(
          'Öl aus der Mikroalge Schizochytrium sp., Salz',
          INGREDIENT_LANGUAGE_DE,
        ),
      ).toEqual([
        { name: 'Öl aus der Mikroalge Schizochytrium sp.', fractionBasisPoints: null },
        { name: 'Salz', fractionBasisPoints: null },
      ])
    })
  })

  describe('given separators between ingredients', () => {
    it('when a semicolon separates them, splits there', () => {
      expect(parseIngredientsText('Hafer; Salz', INGREDIENT_LANGUAGE_DE)).toEqual([
        { name: 'Hafer', fractionBasisPoints: null },
        { name: 'Salz', fractionBasisPoints: null },
      ])
    })

    it('when commas are inside square or curly brackets, does not split there', () => {
      expect(
        parseIngredientsText('Teig [Mehl, Wasser], Butter {Nüsse; Salz}', INGREDIENT_LANGUAGE_DE),
      ).toEqual([
        { name: 'Teig [Mehl, Wasser]', fractionBasisPoints: null },
        { name: 'Butter {Nüsse; Salz}', fractionBasisPoints: null },
      ])
    })

    it('when a comma is a decimal separator, does not split there', () => {
      expect(parseIngredientsText('Kokosöl 12,9 %, Salz', INGREDIENT_LANGUAGE_DE)).toEqual([
        { name: 'Kokosöl', fractionBasisPoints: 1290 },
        { name: 'Salz', fractionBasisPoints: null },
      ])
    })
  })

  describe('given percentages', () => {
    it('when the percentage precedes the name, assigns it to the ingredient', () => {
      expect(parseIngredientsText('12 % Rohrzucker, Salz', INGREDIENT_LANGUAGE_DE)).toEqual([
        { name: 'Rohrzucker', fractionBasisPoints: 1200 },
        { name: 'Salz', fractionBasisPoints: null },
      ])
    })

    it('when the percentage is alone in brackets, removes the brackets', () => {
      expect(parseIngredientsText('HAFER (4,7%), Salz', INGREDIENT_LANGUAGE_DE)).toEqual([
        { name: 'HAFER', fractionBasisPoints: 470 },
        { name: 'Salz', fractionBasisPoints: null },
      ])
    })

    it('when the bracketed percentage is a minimum, takes it as is', () => {
      expect(parseIngredientsText('ERDNÜSSE (mind. 62%), Salz', INGREDIENT_LANGUAGE_DE)).toEqual([
        { name: 'ERDNÜSSE', fractionBasisPoints: 6200 },
        { name: 'Salz', fractionBasisPoints: null },
      ])
    })

    it('when the percentage belongs to a sub-ingredient, does not assign it to the ingredient', () => {
      expect(
        parseIngredientsText('Marzipan (MANDELN 29 %, Zucker)', INGREDIENT_LANGUAGE_DE),
      ).toEqual([{ name: 'Marzipan (MANDELN 29 %, Zucker)', fractionBasisPoints: null }])
    })

    it('when a compound ingredient has a bracketed percentage, keeps its composition', () => {
      expect(
        parseIngredientsText('Gemüse (46%)* [Kohl, Karotten], Salz', INGREDIENT_LANGUAGE_DE),
      ).toEqual([
        { name: 'Gemüse [Kohl, Karotten]', fractionBasisPoints: 4600 },
        { name: 'Salz', fractionBasisPoints: null },
      ])
    })
  })

  describe('given ingredient names', () => {
    it('when names carry footnote markers, removes them', () => {
      expect(
        parseIngredientsText(
          'Hafer**, Salz¹, Zucker², Öl³, Reis°, NÜSSE*geröstet',
          INGREDIENT_LANGUAGE_DE,
        ),
      ).toEqual([
        { name: 'Hafer', fractionBasisPoints: null },
        { name: 'Salz', fractionBasisPoints: null },
        { name: 'Zucker', fractionBasisPoints: null },
        { name: 'Öl', fractionBasisPoints: null },
        { name: 'Reis', fractionBasisPoints: null },
        { name: 'NÜSSE geröstet', fractionBasisPoints: null },
      ])
    })

    it('when a segment contains no letters, skips it', () => {
      expect(parseIngredientsText('Hafer, 12 %, Salz', INGREDIENT_LANGUAGE_DE)).toEqual([
        { name: 'Hafer', fractionBasisPoints: null },
        { name: 'Salz', fractionBasisPoints: null },
      ])
    })

    it('when the statement starts with an ingredients heading, removes it', () => {
      expect(parseIngredientsText('Zutaten: Wasser, Salz', INGREDIENT_LANGUAGE_DE)).toEqual([
        { name: 'Wasser', fractionBasisPoints: null },
        { name: 'Salz', fractionBasisPoints: null },
      ])
    })

    it('when the statement starts with another heading, removes it', () => {
      expect(parseIngredientsText('Füllung: Kohl, Salz', INGREDIENT_LANGUAGE_DE)).toEqual([
        { name: 'Kohl', fractionBasisPoints: null },
        { name: 'Salz', fractionBasisPoints: null },
      ])
    })

    it('when the first colon is inside brackets, keeps the first ingredient', () => {
      expect(
        parseIngredientsText('Creme [Süßungsmittel: Maltit; Palmöl], Salz', INGREDIENT_LANGUAGE_DE),
      ).toEqual([
        { name: 'Creme [Süßungsmittel: Maltit; Palmöl]', fractionBasisPoints: null },
        { name: 'Salz', fractionBasisPoints: null },
      ])
    })

    it('when an ingredients heading is in the middle of the list, separates the ingredients there', () => {
      expect(
        parseIngredientsText('Kohl, Gewürze* Zutaten Teig: Wasser, Mehl', INGREDIENT_LANGUAGE_DE),
      ).toEqual([
        { name: 'Kohl', fractionBasisPoints: null },
        { name: 'Gewürze', fractionBasisPoints: null },
        { name: 'Wasser', fractionBasisPoints: null },
        { name: 'Mehl', fractionBasisPoints: null },
      ])
    })

    it('when a second list follows the end of the first one, includes it', () => {
      expect(
        parseIngredientsText(
          'Teig [Mehl, Wasser]. \nZutaten: Sauce [Soja, Salz]. \nKann Spuren enthalten.',
          INGREDIENT_LANGUAGE_DE,
        ),
      ).toEqual([
        { name: 'Teig [Mehl, Wasser]', fractionBasisPoints: null },
        { name: 'Sauce [Soja, Salz]', fractionBasisPoints: null },
      ])
    })

    it('when a word other than the heading keyword precedes a colon, keeps it as a class prefix', () => {
      expect(parseIngredientsText('Wasser, Emulgator: Lecithin', INGREDIENT_LANGUAGE_DE)).toEqual([
        { name: 'Wasser', fractionBasisPoints: null },
        { name: 'Emulgator: Lecithin', fractionBasisPoints: null },
      ])
    })
  })

  describe('given organic declarations', () => {
    it('when the packaging declares all ingredients as organic, marks every ingredient as organic', () => {
      expect(
        parseIngredientsText(
          'Hafer, Salz • Alle Zutaten aus kontrolliert biologischem Anbau',
          INGREDIENT_LANGUAGE_DE,
        ),
      ).toEqual([
        { name: 'Hafer (Bio)', fractionBasisPoints: null },
        { name: 'Salz (Bio)', fractionBasisPoints: null },
      ])
    })

    it('when the collective declaration wraps across lines, still marks every ingredient as organic', () => {
      expect(
        parseIngredientsText('Hafer, Salz • Alle \nZutaten aus Bio-Anbau', INGREDIENT_LANGUAGE_DE),
      ).toEqual([
        { name: 'Hafer (Bio)', fractionBasisPoints: null },
        { name: 'Salz (Bio)', fractionBasisPoints: null },
      ])
    })

    it('when a collective statement does not mention organic farming, does not mark ingredients as organic', () => {
      expect(
        parseIngredientsText('Hafer, Salz. Alle Zutaten sind vegan.', INGREDIENT_LANGUAGE_DE),
      ).toEqual([
        { name: 'Hafer', fractionBasisPoints: null },
        { name: 'Salz', fractionBasisPoints: null },
      ])
    })

    it('when a remark explains the marker as organic, marks starred ingredients as organic', () => {
      expect(
        parseIngredientsText(
          'Hafer*, Salz. Hinweis: Der * (Stern) kennzeichnet Zutaten ökologischer Erzeugung.',
          INGREDIENT_LANGUAGE_DE,
        ),
      ).toEqual([
        { name: 'Hafer (Bio)', fractionBasisPoints: null },
        { name: 'Salz', fractionBasisPoints: null },
      ])
    })

    it('when a name starts with an organic prefix, moves it to the organic suffix', () => {
      expect(
        parseIngredientsText('Bio-Kochbananen, Öko-Hafer, Salz', INGREDIENT_LANGUAGE_DE),
      ).toEqual([
        { name: 'Kochbananen (Bio)', fractionBasisPoints: null },
        { name: 'Hafer (Bio)', fractionBasisPoints: null },
        { name: 'Salz', fractionBasisPoints: null },
      ])
    })

    it('when a prefixed ingredient is also starred, adds the organic suffix once', () => {
      expect(
        parseIngredientsText('Bio-Kochbananen*, Salz \n*aus Bio-Anbau', INGREDIENT_LANGUAGE_DE),
      ).toEqual([
        { name: 'Kochbananen (Bio)', fractionBasisPoints: null },
        { name: 'Salz', fractionBasisPoints: null },
      ])
    })

    it('when the footnote does not mention organic farming, does not mark starred ingredients as organic', () => {
      expect(
        parseIngredientsText(
          'Kakaomasse** 3%, Salz. ** Rainforest Alliance Certified.',
          INGREDIENT_LANGUAGE_DE,
        ),
      ).toEqual([
        { name: 'Kakaomasse', fractionBasisPoints: 300 },
        { name: 'Salz', fractionBasisPoints: null },
      ])
    })
  })

  describe('given an english statement', () => {
    it('when a trace notice follows, ends the list there', () => {
      expect(parseIngredientsText('Oats, salt may contain nuts', INGREDIENT_LANGUAGE_EN)).toEqual([
        { name: 'Oats', fractionBasisPoints: null },
        { name: 'salt', fractionBasisPoints: null },
      ])
    })

    it('when the packaging declares all ingredients as organic, marks every ingredient as organic', () => {
      expect(
        parseIngredientsText('Oats, salt. All ingredients are organic.', INGREDIENT_LANGUAGE_EN),
      ).toEqual([
        { name: 'Oats (Bio)', fractionBasisPoints: null },
        { name: 'salt (Bio)', fractionBasisPoints: null },
      ])
    })

    it('when the statement starts with an ingredients heading, removes it', () => {
      expect(parseIngredientsText('Ingredients: Oats, salt', INGREDIENT_LANGUAGE_EN)).toEqual([
        { name: 'Oats', fractionBasisPoints: null },
        { name: 'salt', fractionBasisPoints: null },
      ])
    })
  })

  describe('given real packaging statements', () => {
    it('when an organic footnote follows the last ingredient inline (Alnavit), excludes it', () => {
      const text =
        'Wasser, VOLLKORNHAFER* glutenfrei 11 %, Sonnenblumenöl*, Meersalz *aus biologischer Landwirtschaft'

      expect(parseIngredientsText(text, INGREDIENT_LANGUAGE_DE)).toEqual([
        { name: 'Wasser', fractionBasisPoints: null },
        { name: 'VOLLKORNHAFER glutenfrei (Bio)', fractionBasisPoints: 1100 },
        { name: 'Sonnenblumenöl (Bio)', fractionBasisPoints: null },
        { name: 'Meersalz', fractionBasisPoints: null },
      ])
    })

    it('when a blank line with whitespace precedes the notice (Pistazien), excludes it', () => {
      const text =
        'PISTAZIENkerne, geröstet \n \nKann Spuren von anderen Schalenfrüchten enthalten.\n'

      expect(parseIngredientsText(text, INGREDIENT_LANGUAGE_DE)).toEqual([
        { name: 'PISTAZIENkerne', fractionBasisPoints: null },
        { name: 'geröstet', fractionBasisPoints: null },
      ])
    })

    it('when an equals footnote is on its own line, marks starred ingredients as organic', () => {
      const text =
        'Trinkwasser, Karotte*, Steinsalz, Pfeffer*\n*= aus kontrolliert biologischem Anbau'

      expect(parseIngredientsText(text, INGREDIENT_LANGUAGE_DE)).toEqual([
        { name: 'Trinkwasser', fractionBasisPoints: null },
        { name: 'Karotte (Bio)', fractionBasisPoints: null },
        { name: 'Steinsalz', fractionBasisPoints: null },
        { name: 'Pfeffer (Bio)', fractionBasisPoints: null },
      ])
    })

    it('when the list wraps onto a new line (3Bears), keeps the ingredients after the wrap', () => {
      const text =
        '26% VOLLKORN-HAFERFLOCKEN, 13% geröstete gehackte Mandeln, \n11% geröstete gehackte Haselnüsse, Meersalz'

      expect(parseIngredientsText(text, INGREDIENT_LANGUAGE_DE)).toEqual([
        { name: 'VOLLKORN-HAFERFLOCKEN', fractionBasisPoints: 2600 },
        { name: 'geröstete gehackte Mandeln', fractionBasisPoints: 1300 },
        { name: 'geröstete gehackte Haselnüsse', fractionBasisPoints: 1100 },
        { name: 'Meersalz', fractionBasisPoints: null },
      ])
    })

    it('when bacteria names and vitamins contain periods (Alpro), ends the list after the vitamin', () => {
      const text =
        'Wasser, HAFER(4,7%), Joghurtkulturen (S. thermophilus, L. bulgaricus), Vitamine B2,B12. Kann andere glutenhaltige Getreidesorten enthalten.'

      expect(parseIngredientsText(text, INGREDIENT_LANGUAGE_DE)).toEqual([
        { name: 'Wasser', fractionBasisPoints: null },
        { name: 'HAFER', fractionBasisPoints: 470 },
        { name: 'Joghurtkulturen (S. thermophilus, L. bulgaricus)', fractionBasisPoints: null },
        { name: 'Vitamine B2', fractionBasisPoints: null },
        { name: 'B12', fractionBasisPoints: null },
      ])
    })

    it('when compound ingredients use square brackets (Bibigo), keeps their composition and share', () => {
      const text =
        'Gemüse (46%)* [Kohl, Karotten, Zwiebeln], WEIZENmehl, Tofu (4%)* [SOJAbohnen, Wasser], schwarzer Pfeffer, gemahlen.\n\n*Gemüse und Tofu sind aus EU und Nicht-EU Ländern.'

      expect(parseIngredientsText(text, INGREDIENT_LANGUAGE_DE)).toEqual([
        { name: 'Gemüse [Kohl, Karotten, Zwiebeln]', fractionBasisPoints: 4600 },
        { name: 'WEIZENmehl', fractionBasisPoints: null },
        { name: 'Tofu [SOJAbohnen, Wasser]', fractionBasisPoints: 400 },
        { name: 'schwarzer Pfeffer', fractionBasisPoints: null },
        { name: 'gemahlen', fractionBasisPoints: null },
      ])
    })

    it('when a share is a bracketed minimum (Mr. Tom), takes the share as is', () => {
      const text =
        'ERDNÜSSE (mind. 62%), Glukosesirup, Aroma. KANN SPUREN VON SCHALENFRÜCHTEN ENTHALTEN.'

      expect(parseIngredientsText(text, INGREDIENT_LANGUAGE_DE)).toEqual([
        { name: 'ERDNÜSSE', fractionBasisPoints: 6200 },
        { name: 'Glukosesirup', fractionBasisPoints: null },
        { name: 'Aroma', fractionBasisPoints: null },
      ])
    })

    it('when an abbreviation contains a period (Ahoj), keeps the following ingredients', () => {
      const text = 'Zucker, Säuerungsmittel: Weinsäure (L+) u. Citronensäure, Farbstoffe: Carotine.'

      expect(parseIngredientsText(text, INGREDIENT_LANGUAGE_DE)).toEqual([
        { name: 'Zucker', fractionBasisPoints: null },
        { name: 'Säuerungsmittel: Weinsäure (L+) u. Citronensäure', fractionBasisPoints: null },
        { name: 'Farbstoffe: Carotine', fractionBasisPoints: null },
      ])
    })

    it('when a second list follows after an ingredients heading (Steinhaus), includes it', () => {
      const text =
        '95% gefüllte Teigtaschen [55% Gemüsemischung (Weißkohl, Karotten), WEIZENMEHL, Reisessig]. \nZutaten: 5% Sojasauce [Wasser, SOJABOHNEN]. \nDie gefüllten Teigtaschen können Spuren von SOJA enthalten.'

      expect(parseIngredientsText(text, INGREDIENT_LANGUAGE_DE)).toEqual([
        {
          name: 'gefüllte Teigtaschen [55% Gemüsemischung (Weißkohl, Karotten), WEIZENMEHL, Reisessig]',
          fractionBasisPoints: 9500,
        },
        { name: 'Sojasauce [Wasser, SOJABOHNEN]', fractionBasisPoints: 500 },
      ])
    })

    it('when headings start and divide the list (Soto), removes them', () => {
      const text =
        'Füllung: Weißkohl* (28%), Tofu* (Wasser, SOJABOHNEN*), Gewürze* Zutaten Teig: Wasser, WEIZENMEHL*, Salz *aus kontrolliert ökologischem Anbau Allergenhinweis: Produkt kann Spuren von SENF enthalten.'

      expect(parseIngredientsText(text, INGREDIENT_LANGUAGE_DE)).toEqual([
        { name: 'Weißkohl (Bio)', fractionBasisPoints: 2800 },
        { name: 'Tofu (Wasser, SOJABOHNEN) (Bio)', fractionBasisPoints: null },
        { name: 'Gewürze (Bio)', fractionBasisPoints: null },
        { name: 'Wasser', fractionBasisPoints: null },
        { name: 'WEIZENMEHL (Bio)', fractionBasisPoints: null },
        { name: 'Salz', fractionBasisPoints: null },
      ])
    })

    it('when a long heading starts the statement (Natsu), removes it', () => {
      const text =
        'Gegrillte Teigtaschen mit Gemüse-Füllung (Gyoza): 58 % Gemüse-Füllung (12 % Weißkohl, Ingwer), 25 % Teig (WEIZENMEHL, Wasser). Sesamsauce: Wasser, Rapsöl.'

      expect(parseIngredientsText(text, INGREDIENT_LANGUAGE_DE)).toEqual([
        { name: 'Gemüse-Füllung (12 % Weißkohl, Ingwer)', fractionBasisPoints: 5800 },
        { name: 'Teig (WEIZENMEHL, Wasser)', fractionBasisPoints: 2500 },
      ])
    })

    it('when all ingredients are declared organic after a bullet across a wrap (Simply Raw), marks every ingredient as organic', () => {
      const text =
        'Datteln, PISTAZIEN (24%), Kürbiskerne, \nMANDELN, Limettenpulver (1%) • Alle \nZutaten aus kontrolliert biologischem Anbau'

      expect(parseIngredientsText(text, INGREDIENT_LANGUAGE_DE)).toEqual([
        { name: 'Datteln (Bio)', fractionBasisPoints: null },
        { name: 'PISTAZIEN (Bio)', fractionBasisPoints: 2400 },
        { name: 'Kürbiskerne (Bio)', fractionBasisPoints: null },
        { name: 'MANDELN (Bio)', fractionBasisPoints: null },
        { name: 'Limettenpulver (Bio)', fractionBasisPoints: 100 },
      ])
    })

    it('when a remark explains the marker (Biovegan), marks starred ingredients as organic', () => {
      const text =
        'Kichererbsenmehl* (80 %), Salz, Gewürze* (Knoblauch*, Kümmel*), Schnittlauch*. Hinweis: Der * (Stern) kennzeichnet Zutaten ökologischer Erzeugung.'

      expect(parseIngredientsText(text, INGREDIENT_LANGUAGE_DE)).toEqual([
        { name: 'Kichererbsenmehl (Bio)', fractionBasisPoints: 8000 },
        { name: 'Salz', fractionBasisPoints: null },
        { name: 'Gewürze (Knoblauch, Kümmel) (Bio)', fractionBasisPoints: null },
        { name: 'Schnittlauch (Bio)', fractionBasisPoints: null },
      ])
    })

    it('when names carry an organic prefix and the footnote starts with a percentage (El Origen), marks them as organic', () => {
      const text =
        'Bio-Kochbananen* (64 %), Bio-Sonnenblumenöl*, Meersalz \n*100 % aus kontrolliert biologischem Anbau'

      expect(parseIngredientsText(text, INGREDIENT_LANGUAGE_DE)).toEqual([
        { name: 'Kochbananen (Bio)', fractionBasisPoints: 6400 },
        { name: 'Sonnenblumenöl (Bio)', fractionBasisPoints: null },
        { name: 'Meersalz', fractionBasisPoints: null },
      ])
    })

    it('when a Demeter share follows the list (Mogli), excludes it', () => {
      const text =
        '\nDINKELmehl* (eine WEIZENart) 75 %, Palmfett**, Meersalz, \nBrezellauge: Natriumhydroxid \nDemeter-Anteil 91% \n*aus biologisch-dynamischem Anbau \n**aus biologischem Anbau'

      expect(parseIngredientsText(text, INGREDIENT_LANGUAGE_DE)).toEqual([
        { name: 'DINKELmehl (eine WEIZENart) (Bio)', fractionBasisPoints: 7500 },
        { name: 'Palmfett (Bio)', fractionBasisPoints: null },
        { name: 'Meersalz', fractionBasisPoints: null },
        { name: 'Brezellauge: Natriumhydroxid', fractionBasisPoints: null },
      ])
    })

    it('when a cocoa content remark follows the list (Koro), excludes it', () => {
      const text =
        '30 % glutenfreie HAFERFLOCKEN*, Agavendicksaft*, Salz; Kakao: 53 % mindestens in der Schokolade *aus biologischer Landwirtschaft'

      expect(parseIngredientsText(text, INGREDIENT_LANGUAGE_DE)).toEqual([
        { name: 'glutenfreie HAFERFLOCKEN (Bio)', fractionBasisPoints: 3000 },
        { name: 'Agavendicksaft (Bio)', fractionBasisPoints: null },
        { name: 'Salz', fractionBasisPoints: null },
      ])
    })

    it('when shares use decimal commas and the footnote follows a comma (Heimatgut), keeps the shares', () => {
      const text =
        'Mais* 58,6%, Rohrzucker*, Kokosöl* 12,9%, Meersalz 0,7%, \n*aus biologischem Anbau'

      expect(parseIngredientsText(text, INGREDIENT_LANGUAGE_DE)).toEqual([
        { name: 'Mais (Bio)', fractionBasisPoints: 5860 },
        { name: 'Rohrzucker (Bio)', fractionBasisPoints: null },
        { name: 'Kokosöl (Bio)', fractionBasisPoints: 1290 },
        { name: 'Meersalz', fractionBasisPoints: 70 },
      ])
    })

    it('when only a sub-ingredient has a share (Marzipan), does not assign it to the ingredient', () => {
      const text =
        'Marzipan* (Rohrohrzucker*, MANDELN* 29 %, Wasser), Meersalz *aus biologischer Landwirtschaft.'

      expect(parseIngredientsText(text, INGREDIENT_LANGUAGE_DE)).toEqual([
        { name: 'Marzipan (Rohrohrzucker, MANDELN 29 %, Wasser) (Bio)', fractionBasisPoints: null },
        { name: 'Meersalz', fractionBasisPoints: null },
      ])
    })

    it('when a double asterisk footnote is not about organic farming (Corny), does not mark ingredients as organic', () => {
      const text =
        'VOLLKORNHAFERFLOCKEN 52%, Kakaomasse** 3%, fettarmes \nKakaopulver** 2%, Salz. Kann SCHALENFRÜCHTE enthalten. * Kann bei übermäßigem Verzehr abführend wirken. ** Rainforest Alliance Certified.'

      expect(parseIngredientsText(text, INGREDIENT_LANGUAGE_DE)).toEqual([
        { name: 'VOLLKORNHAFERFLOCKEN', fractionBasisPoints: 5200 },
        { name: 'Kakaomasse', fractionBasisPoints: 300 },
        { name: 'fettarmes Kakaopulver', fractionBasisPoints: 200 },
        { name: 'Salz', fractionBasisPoints: null },
      ])
    })

    it('when a vitamin name contains bio (Biotin), does not treat it as organic', () => {
      const text = 'Niacin, B6, Biotin, Folsäure, B12,\nC, D2, E.'

      expect(parseIngredientsText(text, INGREDIENT_LANGUAGE_DE)).toEqual([
        { name: 'Niacin', fractionBasisPoints: null },
        { name: 'B6', fractionBasisPoints: null },
        { name: 'Biotin', fractionBasisPoints: null },
        { name: 'Folsäure', fractionBasisPoints: null },
        { name: 'B12', fractionBasisPoints: null },
        { name: 'C', fractionBasisPoints: null },
        { name: 'D2', fractionBasisPoints: null },
        { name: 'E', fractionBasisPoints: null },
      ])
    })
  })

  it('given the text is empty, returns an empty list', () => {
    expect(parseIngredientsText('', INGREDIENT_LANGUAGE_DE)).toEqual([])
  })

  it('given a compound ingredient with its own percentage, keeps its sub-ingredients as a qualifier', () => {
    const text =
      'SOJADRINK* 72% (Wasser, SOJABOHNEN* 14%), MANDELMUS* 18%, Kokosnussöl*, Tapiokastärke*, Salz, Stabilisator: Johannisbrotkernmehl*, Xanthan, Kulturen.'

    expect(parseIngredientsText(text, INGREDIENT_LANGUAGE_DE)).toEqual([
      { name: 'SOJADRINK (Wasser, SOJABOHNEN 14%)', fractionBasisPoints: 7200 },
      { name: 'MANDELMUS', fractionBasisPoints: 1800 },
      { name: 'Kokosnussöl', fractionBasisPoints: null },
      { name: 'Tapiokastärke', fractionBasisPoints: null },
      { name: 'Salz', fractionBasisPoints: null },
      { name: 'Stabilisator: Johannisbrotkernmehl', fractionBasisPoints: null },
      { name: 'Xanthan', fractionBasisPoints: null },
      { name: 'Kulturen', fractionBasisPoints: null },
    ])
  })

  it('given several bracketed qualifiers, splits only at top-level commas', () => {
    const text =
      'Wasser, HAFER 10%, Rapsöl, Säureregulator (Dikaliumphosphat), Mineralien (Calciumcarbonat, Kaliumiodid), Salz, Vitamine (D2, Riboflavin, B12).'

    expect(parseIngredientsText(text, INGREDIENT_LANGUAGE_DE)).toEqual([
      { name: 'Wasser', fractionBasisPoints: null },
      { name: 'HAFER', fractionBasisPoints: 1000 },
      { name: 'Rapsöl', fractionBasisPoints: null },
      { name: 'Säureregulator (Dikaliumphosphat)', fractionBasisPoints: null },
      { name: 'Mineralien (Calciumcarbonat, Kaliumiodid)', fractionBasisPoints: null },
      { name: 'Salz', fractionBasisPoints: null },
      { name: 'Vitamine (D2, Riboflavin, B12)', fractionBasisPoints: null },
    ])
  })
})
