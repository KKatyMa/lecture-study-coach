import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const pages = [
  {
    heading: "STA 621 — Maximum Likelihood and Bayesian Inference",
    body: [
      "Lecture notes. Master's course. All definitions below are examinable.",
      "We study parametric inference from two viewpoints that share the same likelihood. Frequentist inference treats the unknown parameter theta as a fixed constant and asks what the data-generating process would do in repeated samples. Bayesian inference treats theta as a random variable, assigns a prior, and updates that prior with the likelihood.",
      "Section 1. The likelihood as a function of the parameter.",
      "For independent identically distributed observations x_1, ..., x_n with density f(x | theta), the likelihood is L(theta | x) = product_i f(x_i | theta). After the sample is observed, L is a function of theta only. It scores how well each candidate parameter value explains the data. The likelihood is not a probability distribution over theta unless it is later combined with a prior and normalised.",
      "The log-likelihood ell(theta) = log L(theta | x) is preferred for computation and for asymptotic expansions. The score function is the gradient of ell. Setting the score to zero yields critical points of the likelihood.",
    ],
  },
  {
    heading: "Identifiability and regularity",
    body: [
      "A parameter is identifiable when distinct values of theta induce distinct distributions of the data. Without identifiability, maximising L cannot recover a unique theta.",
      "Standard maximum-likelihood asymptotics assume the true value theta_0 is an interior point of the parameter space, the log-likelihood is twice differentiable, and the Fisher information is finite and positive definite. Under those regularity conditions, there exists a consistent root of the score equation.",
      "Section 2. Maximum likelihood estimation.",
      "The maximum likelihood estimator is theta-hat_MLE = arg max L(theta | x). Equivalently, it maximises the log-likelihood. The MLE enjoys an invariance property: the MLE of g(theta) is g(theta-hat_MLE) for a well-behaved function g.",
      "Under regularity, sqrt(n) times (theta-hat_MLE - theta_0) converges in distribution to a normal law with mean zero and covariance equal to the inverse of the Fisher information I(theta_0). In that sense the MLE is asymptotically efficient.",
    ],
  },
  {
    heading: "Fisher information",
    body: [
      "Section 2.1. Fisher information.",
      "The Fisher information is I(theta) = E_theta [ - second derivative of ell ]. By the information equality this also equals the variance of the score. Large Fisher information means a sharply peaked expected log-likelihood: the data are expected to be informative about theta.",
      "The inverse Fisher information is the Cramer-Rao lower bound on the covariance of unbiased estimators. The observed information, minus the Hessian of ell evaluated at the MLE, is the usual plug-in estimate of I(theta) and appears in Wald confidence intervals.",
      "Section 3. Bayes theorem for parameters.",
      "Let pi(theta) be a prior distribution on the parameter. Bayes theorem in parametric form states that the posterior satisfies pi(theta | x) proportional to L(theta | x) times pi(theta). Written with the normalising constant, pi(theta | x) = L(theta | x) pi(theta) / m(x), where the marginal likelihood, or evidence, is m(x) = integral L(theta | x) pi(theta) d theta.",
      "The prior encodes information available before the current sample is used. The likelihood reweights that prior. The posterior is the complete Bayesian description of uncertainty about theta after seeing the data.",
    ],
  },
  {
    heading: "Conjugate priors",
    body: [
      "Section 3.1. Conjugate priors.",
      "A prior family is conjugate to a likelihood if the posterior remains in the same family. Classic pairs include the Beta prior with a Binomial likelihood, the Gamma prior with a Poisson likelihood, and a Normal prior with a Normal likelihood when the variance is known.",
      "Conjugacy yields closed-form posterior means and variances. The prior can often be read as a set of pseudo-counts, so you can see how strongly the prior competes with the observed sample. Conjugacy is a computational convenience, not a requirement of Bayesian reasoning.",
      "Section 4. Point and interval summaries.",
      "The maximum a posteriori, or MAP, estimate maximises the posterior: theta-hat_MAP = arg max pi(theta | x). Equivalently it maximises ell(theta) + log pi(theta). The log-prior acts as a penalty, so MAP is a regularised MLE. MAP coincides with the MLE when the prior is flat in that parameterisation. MAP need not equal the posterior mean when the posterior is skewed.",
    ],
  },
  {
    heading: "Credible intervals and confidence intervals",
    body: [
      "A 95 percent credible interval is a set C(x) such that the posterior probability that theta lies in C(x) equals 0.95. This is a direct probability statement about the parameter given the observed data. Highest posterior density intervals are the shortest sets with a given posterior mass.",
      "A 95 percent confidence interval is a random set C-hat(X) constructed so that, before the data are seen, the frequentist coverage P_theta(theta is in C-hat(X)) is approximately 0.95. After the data are observed, that particular interval either contains theta or it does not. It is a category error to attach a posterior probability to a realised confidence interval, and equally an error to claim frequentist coverage for a credible interval without further argument.",
      "The two procedures can numerically agree in large samples, because the posterior often concentrates like the likelihood. Agreement of numbers does not make the interpretations the same.",
    ],
  },
  {
    heading: "Prediction, default priors, and computation",
    body: [
      "Section 5. Prediction, priors, and computation.",
      "The posterior predictive distribution of a new observation x-tilde is p(x-tilde | x) = integral p(x-tilde | theta) pi(theta | x) d theta. Parameter uncertainty is integrated out. Plugging a point estimate into p(x-tilde | theta-hat) understates predictive uncertainty.",
      "An improper prior is a measure that does not integrate to one, for example pi(theta) proportional to 1 on the real line. It is usable only when the resulting posterior is a proper probability distribution. If the posterior is also improper, Bayesian updating is undefined.",
      "Jeffreys prior is pi_J(theta) proportional to the square root of the determinant of the Fisher information. It is invariant under reparameterisation: transforming theta does not silently change the prior's meaning, unlike a naive uniform prior on an arbitrary scale.",
      "When the posterior is not conjugate, closed-form integration fails. Markov chain Monte Carlo methods — Metropolis-Hastings, Gibbs sampling, Hamiltonian Monte Carlo — construct a Markov chain whose stationary distribution is the posterior. Posterior expectations are then estimated by sample averages along the chain.",
      "Exam reminder. Be prepared to: write L(theta | x) for a named sampling model; derive a conjugate posterior; contrast MLE with MAP; state the probability claimed by a credible interval versus a confidence interval; and explain why the posterior predictive averages over theta rather than plugging in theta-hat.",
    ],
  },
];

function wrap(text, max = 92) {
  const words = text.split(/\s+/);
  const lines = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > max) {
      if (current) lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines;
}

const doc = await PDFDocument.create();
const font = await doc.embedFont(StandardFonts.TimesRoman);
const bold = await doc.embedFont(StandardFonts.TimesRomanBold);

for (const pageSpec of pages) {
  const page = doc.addPage([612, 792]);
  let y = 740;
  page.drawText(pageSpec.heading, { x: 54, y, font: bold, size: 14, color: rgb(0.12, 0.16, 0.28) });
  y -= 28;
  for (const paragraph of pageSpec.body) {
    for (const line of wrap(paragraph)) {
      if (y < 64) break;
      page.drawText(line, { x: 54, y, font, size: 11, color: rgb(0.1, 0.1, 0.12) });
      y -= 16;
    }
    y -= 10;
  }
}

const bytes = await doc.save();
const dir = dirname(fileURLToPath(import.meta.url));
const out = join(dir, "..", "public", "sample-lecture.pdf");
writeFileSync(out, bytes);
console.log(`Wrote ${out} (${bytes.length} bytes)`);
