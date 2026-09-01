import type { Flashcard, Outline } from "@/lib/schema";

export const DEMO_FILE_NAME = "STA621-Bayesian-Inference-lecture-notes.pdf";
export const DEMO_HASH = "demo-sta621-bayes-mle";

export const DEMO_OUTLINE: Outline = {
  title: "STA 621 — Maximum Likelihood and Bayesian Inference",
  summary:
    "This lecture develops estimation from two complementary viewpoints. Frequentist inference treats parameters as fixed unknowns and maximises the likelihood; Bayesian inference treats parameters as random and updates a prior with the same likelihood to obtain a posterior. We define the likelihood function, the MLE, and Fisher information, then apply Bayes’ theorem to priors and posteriors, including conjugate families. Point summaries (MLE versus MAP), interval summaries (confidence versus credible intervals), and the posterior predictive distribution are contrasted. The lecture closes with improper and Jeffreys priors, the role of the marginal likelihood in model comparison, and a brief motivation for MCMC when posteriors lack closed form.",
  sections: [
    {
      id: "sec-1",
      title: "The likelihood as a function of the parameter",
      level: 1,
      bullets: [
        "For i.i.d. data, the likelihood is L(θ | x) = ∏ f(xᵢ | θ), treated as a function of θ after the sample is observed.",
        "The log-likelihood ℓ(θ) is preferred numerically and for asymptotic arguments.",
        "The score function is the gradient of ℓ; setting it to zero yields critical points of the likelihood.",
      ],
      children: [
        {
          id: "sec-1-1",
          title: "Identifiability and regularity",
          level: 2,
          bullets: [
            "A parameter is identifiable when distinct θ induce distinct distributions.",
            "Standard MLE asymptotics assume the true θ₀ is interior and the Fisher information is finite and positive definite.",
          ],
        },
      ],
    },
    {
      id: "sec-2",
      title: "Maximum likelihood estimation",
      level: 1,
      bullets: [
        "The MLE θ̂_MLE maximises L(θ | x), or equivalently ℓ(θ).",
        "Invariance: the MLE of g(θ) is g(θ̂_MLE) for a well-behaved function g.",
        "Under regularity, √n (θ̂_MLE − θ₀) → N(0, I(θ₀)⁻¹), so the MLE is asymptotically efficient.",
      ],
      children: [
        {
          id: "sec-2-1",
          title: "Fisher information",
          level: 2,
          bullets: [
            "I(θ) = E[−∂²ℓ/∂θ∂θᵀ] equals the variance of the score (information equality).",
            "The inverse Fisher information is the Cramér–Rao lower bound on unbiased estimators.",
            "Observed information −ℓ''(θ̂) is the usual plug-in estimate of I(θ).",
          ],
        },
      ],
    },
    {
      id: "sec-3",
      title: "Bayes’ theorem for parameters",
      level: 1,
      bullets: [
        "The posterior satisfies π(θ | x) ∝ L(θ | x) π(θ).",
        "The prior π(θ) encodes information before seeing the sample; the likelihood reweights it.",
        "The normalising constant m(x) = ∫ L(θ | x) π(θ) dθ is the marginal likelihood, or evidence.",
      ],
      children: [
        {
          id: "sec-3-1",
          title: "Conjugate priors",
          level: 2,
          bullets: [
            "A prior is conjugate if the posterior stays in the same family, e.g. Beta–Binomial, Gamma–Poisson, Normal–Normal with known variance.",
            "Conjugacy yields closed-form posterior means and variances, useful for intuition and computation.",
            "The prior sample size of a conjugate prior can be read as pseudo-counts.",
          ],
        },
      ],
    },
    {
      id: "sec-4",
      title: "Point and interval summaries",
      level: 1,
      bullets: [
        "The MAP estimate maximises π(θ | x); it coincides with the MLE for a flat prior on the same parameterisation.",
        "A 95% credible interval is a posterior probability statement about θ, unlike a confidence interval, which is a statement about the procedure.",
        "Highest posterior density (HPD) intervals are the shortest sets with a given posterior mass.",
      ],
    },
    {
      id: "sec-5",
      title: "Prediction, priors, and computation",
      level: 1,
      bullets: [
        "The posterior predictive p(x̃ | x) = ∫ p(x̃ | θ) π(θ | x) dθ averages the sampling model over posterior uncertainty.",
        "Improper priors (e.g. π(θ) ∝ 1) can still yield proper posteriors; Jeffreys prior is invariant to reparameterisation and uses √|I(θ)|.",
        "When the posterior is not conjugate, MCMC (Metropolis–Hastings, Gibbs, HMC) draws from π(θ | x) instead of integrating it in closed form.",
      ],
    },
  ],
  concepts: [
    {
      id: "concept-1",
      term: "Likelihood function",
      definition:
        "L(θ | x) is the joint density of the observed sample viewed as a function of the unknown parameter θ. It measures how well each candidate θ explains the data, but it is not a probability distribution over θ unless it is later normalised with a prior.",
      whyItMatters:
        "Every estimator in this lecture — MLE, MAP, posterior — is built from the same likelihood. Misreading L as a posterior is a common exam error.",
      relatedTerms: ["Log-likelihood", "Score function", "Posterior distribution"],
      sourceHint: "§1 Likelihood",
      importance: "core",
    },
    {
      id: "concept-2",
      term: "Maximum likelihood estimator (MLE)",
      definition:
        "θ̂_MLE = arg max_θ L(θ | x). Under standard regularity conditions it is consistent, asymptotically normal, and attains the Cramér–Rao bound in large samples.",
      whyItMatters:
        "The default frequentist point estimator for parametric models, and the Bayesian MAP when the prior is flat.",
      relatedTerms: ["Likelihood function", "Fisher information", "MAP estimate"],
      sourceHint: "§2 MLE",
      importance: "core",
    },
    {
      id: "concept-3",
      term: "Fisher information",
      definition:
        "I(θ) = E_θ[−∂²ℓ(θ)/∂θ∂θᵀ], equal to Var_θ(score). It quantifies how much the data are expected to say about θ; large I means a sharply peaked likelihood.",
      whyItMatters:
        "It supplies the asymptotic variance of the MLE and the Jeffreys prior, and appears in Wald confidence intervals.",
      relatedTerms: ["Cramér–Rao bound", "Observed information", "Jeffreys prior"],
      sourceHint: "§2.1 Fisher information",
      importance: "core",
    },
    {
      id: "concept-4",
      term: "Prior distribution",
      definition:
        "π(θ) is a probability distribution over the parameter, specified before the current sample is used. It may be informative (expert knowledge, previous studies) or weakly informative.",
      whyItMatters:
        "Without a prior there is no posterior. The prior is the modelling choice that distinguishes Bayesian from pure likelihood inference.",
      relatedTerms: ["Posterior distribution", "Conjugate prior", "Improper prior"],
      sourceHint: "§3 Bayes’ theorem",
      importance: "core",
    },
    {
      id: "concept-5",
      term: "Posterior distribution",
      definition:
        "π(θ | x) ∝ L(θ | x) π(θ) is the updated distribution of the parameter after seeing the data. All Bayesian point and interval summaries are functionals of this distribution.",
      whyItMatters:
        "It is the complete Bayesian answer: not a single number, but a distribution that carries uncertainty.",
      relatedTerms: ["Prior distribution", "Likelihood function", "Marginal likelihood"],
      sourceHint: "§3 Bayes’ theorem",
      importance: "core",
    },
    {
      id: "concept-6",
      term: "Bayes’ theorem (parametric form)",
      definition:
        "π(θ | x) = L(θ | x) π(θ) / m(x), where m(x) = ∫ L(θ | x) π(θ) dθ. In words: posterior is prior reweighted by the likelihood and normalised by the evidence.",
      whyItMatters:
        "This is the single update rule of Bayesian statistics. Every conjugate calculation is just this formula in closed form.",
      relatedTerms: ["Marginal likelihood", "Posterior distribution"],
      sourceHint: "§3 Bayes’ theorem",
      importance: "core",
    },
    {
      id: "concept-7",
      term: "Conjugate prior",
      definition:
        "A prior family is conjugate to a likelihood if the posterior remains in that family. Classic pairs: Beta with Binomial, Gamma with Poisson, Normal with Normal (known variance).",
      whyItMatters:
        "Conjugacy gives analytic posteriors and a pseudo-count interpretation of the prior, so you can see how strongly the prior competes with the data.",
      relatedTerms: ["Prior distribution", "Posterior distribution"],
      sourceHint: "§3.1 Conjugate priors",
      importance: "core",
    },
    {
      id: "concept-8",
      term: "Maximum a posteriori (MAP) estimate",
      definition:
        "θ̂_MAP = arg max_θ π(θ | x) = arg max_θ [ℓ(θ) + log π(θ)]. It is a penalised MLE: the log-prior acts as a regulariser.",
      whyItMatters:
        "MAP is the Bayesian point estimate closest in spirit to the MLE, and it differs from the posterior mean when the posterior is skewed.",
      relatedTerms: ["MLE", "Posterior mean", "Prior distribution"],
      sourceHint: "§4 Point summaries",
      importance: "core",
    },
    {
      id: "concept-9",
      term: "Credible interval",
      definition:
        "An interval C(x) such that π(θ ∈ C(x) | x) = 1 − α. This is a direct posterior probability statement about the parameter, not a coverage guarantee over repeated samples.",
      whyItMatters:
        "Students routinely confuse credible intervals with confidence intervals; exams test whether you can state which probability is being claimed.",
      relatedTerms: ["Confidence interval", "HPD interval", "Posterior distribution"],
      sourceHint: "§4 Interval summaries",
      importance: "core",
    },
    {
      id: "concept-10",
      term: "Confidence interval",
      definition:
        "A random interval Ĉ(X) with frequentist coverage P_θ(θ ∈ Ĉ(X)) ≈ 1 − α. After the data are observed, the realised interval either contains θ or not; there is no posterior probability attached to that particular interval.",
      whyItMatters:
        "This is the frequentist counterpart of a credible interval and must not be given a Bayesian interpretation.",
      relatedTerms: ["Credible interval", "Fisher information", "MLE"],
      sourceHint: "§4 Interval summaries",
      importance: "supporting",
    },
    {
      id: "concept-11",
      term: "Posterior predictive distribution",
      definition:
        "p(x̃ | x) = ∫ p(x̃ | θ) π(θ | x) dθ. A new observation is predicted by averaging the sampling model over the posterior, so parameter uncertainty is not ignored.",
      whyItMatters:
        "Using p(x̃ | θ̂) instead of the posterior predictive understates uncertainty — a frequent practical mistake.",
      relatedTerms: ["Posterior distribution", "Likelihood function"],
      sourceHint: "§5 Prediction",
      importance: "core",
    },
    {
      id: "concept-12",
      term: "Marginal likelihood",
      definition:
        "m(x) = ∫ L(θ | x) π(θ) dθ, also called the evidence. It is the normalising constant of the posterior and the likelihood of the model after integrating out θ.",
      whyItMatters:
        "Bayes factors compare models through the ratio of marginal likelihoods; it is also what makes posterior computation hard.",
      relatedTerms: ["Bayes’ theorem", "Posterior distribution"],
      sourceHint: "§3 Bayes’ theorem",
      importance: "supporting",
    },
    {
      id: "concept-13",
      term: "Jeffreys prior",
      definition:
        "π_J(θ) ∝ √|I(θ)|. It is invariant under reparameterisation: transforming θ does not change the prior’s meaning, unlike a naïve uniform prior.",
      whyItMatters:
        "A default ‘objective’ prior that still uses the geometry of the likelihood via Fisher information.",
      relatedTerms: ["Fisher information", "Improper prior"],
      sourceHint: "§5 Priors",
      importance: "supporting",
    },
    {
      id: "concept-14",
      term: "Improper prior",
      definition:
        "A prior measure that does not integrate to one, such as π(θ) ∝ 1 on ℝ. It is usable when the posterior π(θ | x) is nevertheless a proper distribution.",
      whyItMatters:
        "You must check posterior propriety; an improper prior can yield an improper posterior, in which case Bayesian updating is undefined.",
      relatedTerms: ["Jeffreys prior", "Prior distribution"],
      sourceHint: "§5 Priors",
      importance: "supporting",
    },
    {
      id: "concept-15",
      term: "Markov chain Monte Carlo (MCMC)",
      definition:
        "A family of algorithms (Metropolis–Hastings, Gibbs, Hamiltonian Monte Carlo) that construct a Markov chain whose stationary distribution is the posterior, so posterior expectations are estimated by sample averages.",
      whyItMatters:
        "Most realistic posteriors have no closed form; MCMC is how Bayesian inference is actually computed.",
      relatedTerms: ["Posterior distribution", "Marginal likelihood"],
      sourceHint: "§5 Computation",
      importance: "supporting",
    },
  ],
};

export const DEMO_CARDS: Flashcard[] = [
  {
    id: "card-1",
    type: "term",
    front: "Likelihood function L(θ | x)",
    back: "The joint density of the observed sample viewed as a function of θ. It scores candidate parameter values; it is not itself a probability distribution over θ.",
    difficulty: "core",
    sourceHint: "§1 Likelihood",
    conceptIds: ["concept-1"],
  },
  {
    id: "card-2",
    type: "cloze",
    front: "The ____ is the joint density of the data treated as a function of the unknown parameter, not as a density on that parameter.",
    back: "likelihood function — L(θ | x). Normalising it with a prior produces a posterior.",
    difficulty: "core",
    sourceHint: "§1 Likelihood",
    conceptIds: ["concept-1"],
  },
  {
    id: "card-3",
    type: "term",
    front: "Maximum likelihood estimator (MLE)",
    back: "θ̂_MLE = arg max_θ L(θ | x). Under regularity it is consistent, asymptotically normal, and efficient, with variance given by the inverse Fisher information.",
    difficulty: "core",
    sourceHint: "§2 MLE",
    conceptIds: ["concept-2"],
  },
  {
    id: "card-4",
    type: "cloze",
    front: "Under regularity, the asymptotic variance of the MLE is the inverse of the ____.",
    back: "Fisher information I(θ₀)",
    difficulty: "core",
    sourceHint: "§2.1 Fisher information",
    conceptIds: ["concept-2", "concept-3"],
  },
  {
    id: "card-5",
    type: "term",
    front: "Fisher information I(θ)",
    back: "I(θ) = E[−ℓ''(θ)] = Var(score). It measures expected curvature of the log-likelihood and sets the Cramér–Rao bound.",
    difficulty: "core",
    sourceHint: "§2.1 Fisher information",
    conceptIds: ["concept-3"],
  },
  {
    id: "card-6",
    type: "contrast",
    front: "How does a prior π(θ) differ from a posterior π(θ | x)?",
    back: "The prior is the distribution of θ before the current sample is used. The posterior reweights that prior by the likelihood and normalises: π(θ | x) ∝ L(θ | x) π(θ). All Bayesian summaries are computed from the posterior, not the prior.",
    difficulty: "core",
    sourceHint: "§3 Bayes’ theorem",
    conceptIds: ["concept-4", "concept-5"],
  },
  {
    id: "card-7",
    type: "term",
    front: "Posterior distribution",
    back: "π(θ | x) ∝ L(θ | x) π(θ). It is the Bayesian state of knowledge about θ after seeing the data.",
    difficulty: "core",
    sourceHint: "§3 Bayes’ theorem",
    conceptIds: ["concept-5"],
  },
  {
    id: "card-8",
    type: "cloze",
    front: "Parametric Bayes’ theorem states π(θ | x) = L(θ | x) π(θ) / ____.",
    back: "the marginal likelihood m(x) = ∫ L(θ | x) π(θ) dθ, also called the evidence",
    difficulty: "core",
    sourceHint: "§3 Bayes’ theorem",
    conceptIds: ["concept-6", "concept-12"],
  },
  {
    id: "card-9",
    type: "term",
    front: "Conjugate prior",
    back: "A prior family that is closed under sampling: the posterior stays in the same family. Examples: Beta–Binomial, Gamma–Poisson, Normal–Normal with known variance.",
    difficulty: "core",
    sourceHint: "§3.1 Conjugate priors",
    conceptIds: ["concept-7"],
  },
  {
    id: "card-10",
    type: "contrast",
    front: "How does the MAP estimate differ from the MLE?",
    back: "The MLE maximises the likelihood alone. The MAP maximises likelihood times prior, i.e. ℓ(θ) + log π(θ). They coincide when the prior is flat in that parameterisation; otherwise MAP is a regularised (penalised) MLE and need not equal the posterior mean.",
    difficulty: "core",
    sourceHint: "§4 Point summaries",
    conceptIds: ["concept-2", "concept-8"],
  },
  {
    id: "card-11",
    type: "term",
    front: "Maximum a posteriori (MAP) estimate",
    back: "θ̂_MAP = arg max_θ π(θ | x). Equivalent to maximising ℓ(θ) + log π(θ). A Bayesian point estimate, not a full posterior summary.",
    difficulty: "standard",
    sourceHint: "§4 Point summaries",
    conceptIds: ["concept-8"],
  },
  {
    id: "card-12",
    type: "contrast",
    front: "Credible interval versus confidence interval — what probability is being claimed?",
    back: "A 95% credible interval satisfies π(θ ∈ C | x) = 0.95: a posterior probability about this parameter given these data. A 95% confidence interval has coverage P_θ(θ ∈ Ĉ(X)) = 0.95 over repeated samples; after seeing the data it is not a probability statement about this particular interval.",
    difficulty: "core",
    sourceHint: "§4 Interval summaries",
    conceptIds: ["concept-9", "concept-10"],
  },
  {
    id: "card-13",
    type: "term",
    front: "Credible interval",
    back: "A set C(x) with specified posterior probability, e.g. π(θ ∈ C(x) | x) = 0.95. HPD intervals are the shortest such sets.",
    difficulty: "core",
    sourceHint: "§4 Interval summaries",
    conceptIds: ["concept-9"],
  },
  {
    id: "card-14",
    type: "term",
    front: "Posterior predictive distribution",
    back: "p(x̃ | x) = ∫ p(x̃ | θ) π(θ | x) dθ. New data are predicted by averaging the sampling model over the posterior, thereby folding in parameter uncertainty.",
    difficulty: "standard",
    sourceHint: "§5 Prediction",
    conceptIds: ["concept-11"],
  },
  {
    id: "card-15",
    type: "cloze",
    front: "Predicting a new observation with p(x̃ | θ̂) instead of the ____ understates uncertainty because it plugs in a point estimate.",
    back: "posterior predictive distribution p(x̃ | x)",
    difficulty: "standard",
    sourceHint: "§5 Prediction",
    conceptIds: ["concept-11"],
  },
  {
    id: "card-16",
    type: "term",
    front: "Jeffreys prior",
    back: "π_J(θ) ∝ √|I(θ)|. An invariant default prior constructed from Fisher information, so a reparameterisation does not silently change the prior’s meaning.",
    difficulty: "advanced",
    sourceHint: "§5 Priors",
    conceptIds: ["concept-13"],
  },
  {
    id: "card-17",
    type: "contrast",
    front: "When is an improper prior acceptable?",
    back: "A prior that does not integrate to one (e.g. π(θ) ∝ 1) is acceptable only if the posterior is proper, i.e. ∫ L(θ | x) π(θ) dθ < ∞. If the posterior is also improper, the Bayesian update is undefined.",
    difficulty: "advanced",
    sourceHint: "§5 Priors",
    conceptIds: ["concept-14"],
  },
  {
    id: "card-18",
    type: "term",
    front: "Markov chain Monte Carlo (MCMC)",
    back: "Simulation methods that build a Markov chain with stationary distribution π(θ | x), then estimate posterior expectations by ergodic averages. Used when conjugacy fails.",
    difficulty: "standard",
    sourceHint: "§5 Computation",
    conceptIds: ["concept-15"],
  },
];

export const DEMO_WORD_COUNT = 3120;
export const DEMO_PAGE_COUNT = 8;
