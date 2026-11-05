/**
 * dashboard/task-action-state.ts — pure decision logic for a tasks-page row.
 *
 * Two-step flow: Do -> Verify -> (pending while API/moderator decides) -> badge.
 * The row is a thin renderer; this helper owns the (completionStatus x started x
 * submitting x verificationMethod) matrix so it is unit-testable without a DOM.
 *
 * Contract it depends on (pinned by __tests__/task-complete-contract.test.ts):
 *   - manual / api  -> status 'pending', pointsAwarded 0, server stores proofData
 *   - url_click / quiz_pass -> status 'verified' at completion
 */
import type { TaskCompletionStatus, TaskVerificationMethod } from '@okn/shared';

/** Methods where the user must supply proof; the server cannot auto-decide.
 *  quiz_pass now requires proof (the answers) since G12 added answer verification. */
const PROOF_METHODS: ReadonlySet<TaskVerificationMethod> = new Set(['manual', 'api', 'quiz_pass']);

export type TaskActionPhase = 'idle' | 'started' | 'submitting' | 'settled';

export interface TaskActionState {
  phase: TaskActionPhase;
  /** Label for the primary button (only meaningful in idle/started). */
  primaryLabel: 'Do' | 'Verify';
  /** True when verificationMethod demands a user-supplied proof payload. */
  requiresProof: boolean;
  /** True when a trailing "Pending" indicator should render at the row's end. */
  showPending: boolean;
}

export interface TaskActionInput {
  completionStatus: TaskCompletionStatus | null;
  verificationMethod: TaskVerificationMethod;
  /** User has clicked "Do" but not yet "Verify". Client-only optimist UI state. */
  started: boolean;
  /** The complete mutation is in flight. */
  submitting: boolean;
}

export function getTaskActionState(input: TaskActionInput): TaskActionState {
  const requiresProof = PROOF_METHODS.has(input.verificationMethod);

  // Once the server has a row for this user, the StatusBadge owns the slot.
  // A 'pending' row means the API/moderator has not decided yet -> show Pending.
  if (input.completionStatus) {
    return {
      phase: 'settled',
      primaryLabel: 'Verify',
      requiresProof,
      showPending: input.completionStatus === 'pending',
    };
  }

  // Verify clicked: request is in flight -> render Pending while we wait,
  // regardless of whether this is an auto or manual task.
  if (input.submitting) {
    return { phase: 'submitting', primaryLabel: 'Verify', requiresProof, showPending: true };
  }

  // Do clicked, awaiting Verify.
  if (input.started) {
    return { phase: 'started', primaryLabel: 'Verify', requiresProof, showPending: false };
  }

  // Fresh task, no interaction yet.
  return { phase: 'idle', primaryLabel: 'Do', requiresProof, showPending: false };
}

/**
 * Decision logic for the "Do" button click. Pure so it is unit-testable; the
 * TaskRow renderer turns this into the actual window.open / toast / setStarted
 * side effects.
 *
 * Returns what the row should do when "Do" is pressed:
 *   - redirect:      open the configured URL (new tab, same tab fallback).
 *   - showNoLinkMsg: the admin did not configure a URL, so the click would be a
 *                    silent dead button without a toast. Surfaced for url_click
 *                    (which needs a URL to verify) and manual/api (a link is
 *                    expected but proof can still be entered). quiz_pass with no
 *                    URL is fine (the quiz itself is the task).
 *   - autoSubmit:    url_click collapses Do+Verify; the caller submits
 *                    { visitedUrl } immediately.
 *   - revealProof:   advance the row to the started phase (show the proof input
 *                    or the quiz UI).
 */
export interface DoAction {
  /** True when config.url is set and the caller should open it. */
  redirect: boolean;
  /** True when no URL is configured and the caller should toast a message. */
  showNoLinkMsg: boolean;
  /** True for url_click: the caller should auto-submit { visitedUrl }. */
  autoSubmit: boolean;
  /** True when the caller should advance to the proof/quiz input phase. */
  revealProof: boolean;
}

export function resolveDoAction(args: {
  verificationMethod: TaskVerificationMethod;
  hasUrl: boolean;
}): DoAction {
  const { verificationMethod, hasUrl } = args;

  if (verificationMethod === 'url_click') {
    // The server verifies the visited URL's host against config.url, so a URL
    // is mandatory. With none, there is nothing to verify — tell the user.
    return {
      redirect: hasUrl,
      showNoLinkMsg: !hasUrl,
      autoSubmit: hasUrl,
      revealProof: false,
    };
  }

  // manual / api: a link is expected (the user follows it then returns with a
  // handle/proof), so warn when it is missing. quiz_pass without a URL is fine.
  const expectLink = verificationMethod !== 'quiz_pass';
  return {
    redirect: hasUrl,
    showNoLinkMsg: !hasUrl && expectLink,
    autoSubmit: false,
    revealProof: true,
  };
}
