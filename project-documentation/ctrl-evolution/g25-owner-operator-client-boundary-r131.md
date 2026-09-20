# G25 owner and operator client boundary, R131

Status: `strict_client_boundary_passed`

R131 gives the application two narrow adapters over the hosted R130 seam. The owner adapter can call only the atomic prepare-and-bind operation. The operator adapter can call only the five-field pending queue. Both validate inputs before transport and reject any response that contains an extra field.

The owner receipt must state that the presentation is complete while operator access, decision authority, active-standard mutation and notification are all false. It must also return the same workspace the client requested. The operator response accepts either one exact useful item or the uniform public `not_available` shape. It rejects raw packets, hashes, private denial reasons and impossible available-with-zero states.

Ten unit tests cover the exact calls, malformed identifiers, cross-workspace response substitution, extra private material, transport failure, the exact five-field item, uniform denial, private-reason leakage, hash smuggling and impossible queue state. No route or visual surface changed.

The next bounded step is operator-only experience work. The deferred customer participation surface remains closed until Krish completes its dedicated interview. For the operator queue, materially different concepts must be rendered anonymously, judged through the existing experience council and reduced to one cross-device preview before founder review.
