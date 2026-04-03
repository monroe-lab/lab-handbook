---
type: protocol
title: "How I Use LLMs as a Research and Coding Partner"
---

# How I Use LLMs as a Research and Coding Partner

*Written collaboratively by me and ChatGPT, December 2025.*

I’m dictating this post into my laptop microphone while ChatGPT helps me turn a long, messy stream-of-consciousness transcript into something coherent and structured. That alone illustrates my core point:

> Large language models (LLMs) are not a replacement for thinking.  
> They are an **amplifier** for human knowledge, and an assistant to liberate us from work dudgery (i.e. manually formatting a markdown file).

This is my attempt to lay out a philosophy for using LLMs effectively in research and coding, based on how I actually work right now.

---

## 1. The view from late 2025: “How did we ever get anything done before?”

I’m writing this at the end of 2025. Over the past year, LLMs have crossed an important threshold in my daily work:

- They are now **good enough** to be a constant, embedded assistant.
- They can easily write usable boilerplate code... sbatch headers, standard loops, and “textbook” bioinformatics calls.
- They can help me refactor and document messy scripts into clean, reusable functions.

Used well, LLMs have cut the time for certain tasks by **orders of magnitude**. I genuinely think we’ll look back on the pre‑LLM era and wonder how we ever got anything done as slowly as we did.

But I also think the gains are very unevenly distributed.

---

## 2. LLMs as multipliers, not substitutes

The metaphor I keep coming back to is:

> LLMs are a **multiplier** on your existing ability.  
> If your skill level is 10, maybe they make you 100.  
> But if your skill level is 0, 0 × 100 is still 0.

In other words:

- If you already understand coding, data, and your domain, LLMs can make you **super‑powered**.
- If you don’t know how to code at all, they won’t magically turn you into a competent programmer.

I don’t see LLMs as a replacement for **true understanding**. They are:

- Excellent for **accelerating** learning once you have a foothold.
- Great for **explaining** concepts in multiple ways.
- Fantastic at handling tedious *execution* once you know what you’re trying to do.

But they don’t erase the need for:

- Knowing what a script *should* generally look like.
- Understanding control flow, data structures, and basic algorithms.
- Being able to mentally simulate what your code is doing.

So, paradoxically:

> LLMs don’t make learning to code less important.  
> They make it **more** important, because the payoff is now even bigger.

People who learn to code and understand data will be able to leverage this new tool to do far more than before. People who don’t will increasingly be left behind.  Imagine if LLMs are like a Formula 1 race car. Only people who know how to drive will be able to actually leverage the power/speed (at all and especially safely!). If you didn't know how to drive (code), you're going to be left behind in a world of people driving Formula 1 cars. So you need to learn to drive so you can use the car. 

---
## 3. A “junior collaborator” mental model

One mental model that can be helpful:

> **You are in the lead. The LLM is your junior collaborator.**

LLMs are:

- Tireless  
- Fast  
- Able to generate lots of ideas  
- Often surprisingly insightful  

But they are also:

- Capable of making mistakes  
- Overconfident in their answers  
- Sometimes superficial or overly agreeable  

So it helps to work with an LLM the way you might work with a **smart collaborator who’s new to the project**:

- You give **clear tasks**.
- You specify **inputs, outputs, constraints, and context**.
- You **review the results**.
- You ask it to **explain or show its reasoning** when something looks uncertain.

What I **don’t** do is treat it like:

- A fully trusted expert whose output can be used without any review.

If you wouldn’t hand off a complex analysis to someone new to your lab or team and submit their work without looking it over, you also shouldn’t use an LLM’s output without checking it. The goal is to stay in charge of the thinking, and use the model as a powerful support.

---

## 4. How I actually use LLMs for coding

### 4.1 Boilerplate and tedious work

Any time I know that a task is:

- Standard
- Boring
- Mostly about syntax rather than logic

…I ask the LLM to write it.

Examples:

- **sbatch headers** for Slurm jobs (time, memory, partition, account, logging).
- Basic **parsing of TSV/CSV** files.
- Standard **bioinformatics commands** that follow textbook patterns (e.g. running `bcftools`, `samtools`, `makeblastdb`, etc.).
- Writing **loops** that iterate over samples and call a tool in a consistent way.

I could write all of this myself, but it’s usually a waste of time. I already know what the commands should roughly look like and what they should do; I don’t need to hand‑type every character.

### 4.2 From messy prototype to clean function

Another pattern I use a lot:

1. I work out a piece of code (manually + with LLM help) until it **basically does what I want**.
2. The result is often:
   - A bit messy
   - Not fully documented
   - Hard-coded to a specific dataset or file path.
3. At that point, I:
   - Copy that chunk of code into a prompt.
   - Describe how I want it **refactored**:
     - Turn it into a function.
     - Specify clear **arguments** and **return values**.
     - Remove hard-coded paths.
     - Add comments and annotation of code.
4. The LLM produces a cleaner, generalized function that I can put into my `functions.R` (or equivalent) file.

Over time, this builds up a library of reusable functions, each initially **designed by me**, but often **refined by the LLM**.

### 4.3 Voice → prompt → code

I’ve started using **voice transcription** a lot:

- I talk through what I want:
  - The purpose of the script
  - The data structures
  - The inputs and outputs
  - Constraints (“this needs to run as a Slurm array, each task gets one sample,” etc.)
- The transcription becomes a **long, detailed prompt**.
- The LLM turns that into a real script.

You don’t *need* to dictate prompts, but long, detailed prompts often work very well. Speaking out loud is just a convenient way to generate them.

---

## 5. Guardrails: what I *don’t* use LLMs for

There are some lines I try not to cross.

### 5.1 Don’t generate code you can’t understand

A core rule for me:

> **Don’t use ChatGPT to generate code you couldn’t, in principle, understand yourself.**

That doesn’t mean you already know every detail. It means:

- You’re prepared to read the output line by line.
- If you don’t understand something, you either:
  - Ask the LLM to **explain** that specific part, or
  - Look it up and learn what it’s doing.

The goal is: once you’ve decided to keep a piece of code, you should **understand it well enough** to:

- Debug it when it breaks.
- Adapt it to new data.
- Defend it to a collaborator or reviewer.

If a generated script feels like magic, that’s a red flag.

### 5.2 Don’t outsource things you have zero grasp of

Another rule:

> **Don’t use an LLM to do something for you that you have absolutely no conceptual understanding of.**

If you’re thinking:
- “I have no idea how this analysis works, but I’ll just have ChatGPT do it,”

that’s usually a sign you should:

- Step back
- Learn the basics first
- Then use the LLM to **accelerate** your learning and implementation

You are still responsible for:

- The scientific validity of your analysis
- The correctness of your code
- The interpretation of your results

No tool can substitute for your responsibility as the researcher.

---

## 6. Some practical principles for using LLMs well

Here are the key points I’d give as “nuggets of wisdom” about using LLMs for research and coding:

1. **LLMs are multipliers, not replacements.**  
   The more you know, the more powerful they are. Zero skill × any multiplier is still zero.

2. **Stay in the manager mindset.**  
   Treat the LLM like a smart intern: give clear instructions, check the work, ask for explanations, and retain ownership of decisions.

3. **Always understand the code you keep.**  
   Any script or function that goes into your real workflow should be something you can read and explain. If you don’t understand a line, stop and figure it out.

4. **Don’t skip fundamentals.**  
   Use LLMs to *learn faster*, not to avoid learning. Build your own mental model of how the code and data are flowing.

5. **Use LLMs aggressively for boilerplate and refactoring.**  
   Let them handle:
   - sbatch templates
   - standard loops and input parsing
   - rewriting messy code into clean functions with arguments and docstrings

6. **Describe inputs and outputs, not just “do the thing.”**  
   Good prompts specify:
   - What goes in (file formats, data structures, arguments)
   - What should come out (tables, figures, file formats)
   - Constraints (runtime, memory, environment, cluster specifics)

7. **Iterate in small steps.**  
   - Start with a small example or subset of the data.
   - Test the generated code.
   - Refine the function or script.
   - Only then run it at scale on the full dataset.

8. **Remember: you own the results.**  
   When a figure shows up in a paper or a method goes into a manuscript, your name is on it, not the LLM’s. That’s where the bar for understanding and responsibility has to live.

---

## 7. Closing thoughts

For me, LLMs have already become:

- A default part of my coding workflow.
- A constant background presence in my research life.
- A big reason why I can move from idea → script → figure much faster than before.

But the key shift is **conceptual**:

- I don’t think of them as magic.
- I think of them as **tools and teammates** that I manage.
- I still see my job as:
  - Choosing the questions
  - Designing the analyses
  - Understanding the code
  - Interpreting the results

If you treat LLMs this way—as multipliers, not crutches—I think they’ll massively expand what you can do as a researcher and coder, without hollowing out your understanding along the way.

## Message from human Grey
What you just read was the product of me recording my voice for about 10 minutes and then having ChatGPT reconstruct it into an organized format. I then went back and edited the material. But this is a perfect example of how a task that would have probably taken me at least an hour or two to do was done in maybe 20 minutes or something, and the result is just as good as what I would have created if not better. I don't think I would have put the time into structure it this clearly. Essentially your ideas and get them into text in a much faster and more straightforward way than manually typing/formatting it simply takes away the tedium of doing things. So that's my take on it. 
