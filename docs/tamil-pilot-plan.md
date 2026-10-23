# Tamil pilot — proposal for Rajiv to decide

Nothing here is built yet. It's the plan for the second language, so the decisions are ready when Hindi is proven.

## Why Tamil second
- It's the language your own family speaks at home, so you have built-in testers (Riaan and Anvi) and you can judge it by ear.
- Melbourne has a large Tamil-speaking community, through both Indian and Sri Lankan families.

## The big difference from Hindi: the film list
Tamil families want Tamil cinema, not Sholay in Tamil. The candidates below are films that work as gentle bedtime retellings. **You know these films better than I do — please cut, add and reorder.**

| Film | Year | Why it could work | Watch out for |
|---|---|---|---|
| Kaaka Muttai | 2014 | Two little brothers who dream of tasting pizza. Already a children's story at heart | Poverty themes — keep it warm, not sad |
| Pasanga | 2009 | Schoolkids, rivalry turning into friendship | Very little |
| Enthiran | 2010 | A friendly robot (Chitti). Kids love robots | Cut the action; keep the robot's kindness and confusion |
| Baahubali | 2015 | A grand kingdom adventure (Telugu and Tamil) | Battles must become clever contests |
| Anbe Sivam | 2003 | Two mismatched strangers become friends on a long journey | It's an adult film, so the friendship is the whole story |
| Michael Madana Kama Rajan | 1990 | Four lookalike brothers and the mix-ups — pure comedy | Simplify the plot for little ones |
| Muthu | 1995 | Rajinikanth as a cheerful, kind-hearted hero | Turn the romance into friendship |
| Irudhi Suttru | 2016 | A girl and a tough coach chasing a boxing dream, like Dangal | Turn the boxing into practice and determination, not fighting |

I'd leave out *Anjali* and *Kannathil Muthamittal*. Both are wonderful, but their central sadness doesn't suit bedtime.

## How the Tamil stories should be written
- **Spoken Tamil, not formal written Tamil.** This matters more for Tamil than for Hindi, because written and spoken Tamil are very different. The prompt will ask for warm, everyday spoken Tamil, the way an amma or paati talks at bedtime.
- **Tamil script for the narration** (so the voice says the words right), plus **a romanised copy for your review**, since you speak Tamil but don't read the script. The review document would show the romanised version.
- **Review by ear:** once you've approved a few stories from the romanised text, narrate 2–3 of them first and listen before narrating the rest.
- **A bridge level**, like "Eng + Hindi": English with everyday Tamil words (kanna, saapadu, thoongu, nalla paiyan / nalla ponnu), for kids who understand some Tamil but don't follow a whole story.

## Decisions needed from you
1. Which 6–10 films? Start with the table above.
2. Is a Sri Lankan Tamil audience in scope? It affects word choice, and the voice should suit both if possible.
3. A Tamil narration voice: pick one from ElevenLabs' Voice Library with a natural Tamil accent.
4. The name: "Bollywood Bedtime" doesn't fit Tamil cinema. Worth settling before Tamil ships.

## What changes in the code (small)
- Add `ta` and `en-ta` to `LANGUAGE_CONFIG` in `shared/story-prompt.cjs`, and to `src/constants/languages.js`.
- Add a `languages` field to each film in `src/data/films.js`, so Tamil films only appear for Tamil listeners (and Hindi films only for Hindi and English listeners).
- Add an output that writes the romanised review copy, in `scripts/review-doc.js`.
- The speech engine needs `ta-IN` voice preferences, plus a split on the Tamil full stop (Tamil uses ".", so little changes).
