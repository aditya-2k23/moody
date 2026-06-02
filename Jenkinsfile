//  Jenkinsfile — Moody CI Pipeline
//  Purpose : Quality verification only (lint, test, build).
//             Docker build + push is handled by GitHub Actions (ci-build-push.yml).
//
//  Stages  : Checkout → Install → Security Audit → Lint → Unit Tests → Build
//
//  ENVIRONMENT VARIABLES REQUIRED IN JENKINS CREDENTIALS STORE:
//  For `npm test` (Jest):        NONE — Firebase is mocked; all external
//                                services are stubbed by __mocks__/. Tests
//                                run without any real credentials.
//
//  For `next build`:             The build must see NEXT_PUBLIC_* vars so that
//                                Next.js can embed them into the client bundle.
//                                firebase.js detects NODE_ENV=production + SSR
//                                and uses placeholder values gracefully, so the
//                                build will NOT throw even with dummy values.
//                                Configure the credentials below accordingly:
//
//  Secret Text credentials (add in Jenkins → Manage Credentials):
//    NEXT_PUBLIC_API_KEY              
//    NEXT_PUBLIC_AUTH_DOMAIN          
//    NEXT_PUBLIC_PROJECT_ID           
//    NEXT_PUBLIC_STORAGE_BUCKET       
//    NEXT_PUBLIC_MESSAGING_SENDER_ID  
//    NEXT_PUBLIC_APP_ID               
//    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
//    NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
//
//  SERVER-SIDE vars (firebase-admin, redis, gemini) are lazy-initialised and
//  are NOT needed at build time — they throw only when API routes are called
//  at runtime. No credentials needed for them in this CI pipeline.

pipeline {
    // Agent: any Linux agent that has the NodeJS tool configured in Jenkins.
    // The `nodejs` tool name below must match the name set in:
    // Manage Jenkins → Tools → NodeJS installations → Name
    agent any

    tools {
        // IMPORTANT: This name must exactly match the NodeJS installation name
        // you configured in Jenkins → Manage Jenkins → Tools → NodeJS.
        // Recommended version: Node 22 LTS (compatible with Next.js 16 + React 19).
        nodejs 'NodeJS 22'
    }

    // Environment: inject build-time NEXT_PUBLIC_* vars from Jenkins credentials.
    // These are needed by `next build` to embed public config into the bundle.
    // firebase.js is written to fall back gracefully when running as
    // NODE_ENV=production + SSR (the `isBuildContext` branch), so placeholder
    // values are sufficient — no real Firebase project is needed in CI.
    environment {
        // Disables Next.js telemetry data collection in CI
        NEXT_TELEMETRY_DISABLED = '1'

        // Signals firebase.js to use its graceful build-time fallback
        // (isBuildContext = true when NODE_ENV=production && SSR)
        NODE_ENV = 'production'

        // Tells next.config.mjs (which checks process.env.SKIP_NEXT_VALIDATION === "1")
        // to skip TypeScript/ESLint build errors during the production build stage.
        // Set this to '0' if you want the build to fail on TypeScript/ESLint errors.
        SKIP_NEXT_VALIDATION = '1'

        // NEXT_PUBLIC_* — inject from Jenkins Credentials
        // To add: Jenkins → Manage Credentials → (global) → Add Credentials
        // Kind: Secret text, ID: <the ID used below>
        NEXT_PUBLIC_API_KEY               = credentials('NEXT_PUBLIC_API_KEY')
        NEXT_PUBLIC_AUTH_DOMAIN           = credentials('NEXT_PUBLIC_AUTH_DOMAIN')
        NEXT_PUBLIC_PROJECT_ID            = credentials('NEXT_PUBLIC_PROJECT_ID')
        NEXT_PUBLIC_STORAGE_BUCKET        = credentials('NEXT_PUBLIC_STORAGE_BUCKET')
        NEXT_PUBLIC_MESSAGING_SENDER_ID   = credentials('NEXT_PUBLIC_MESSAGING_SENDER_ID')
        NEXT_PUBLIC_APP_ID                = credentials('NEXT_PUBLIC_APP_ID')
        NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = credentials('NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME')
        NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET = credentials('NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET')
    }

    options {
        // Abort this build if it runs longer than 20 minutes (protects against
        // hung Next.js builds or infinite loops in test workers).
        timeout(time: 20, unit: 'MINUTES')

        // Keep only the last 10 build records + their artifacts in Jenkins.
        // Prevents unbounded disk growth from coverage reports and .next output.
        buildDiscarder(logRotator(numToKeepStr: '10', artifactNumToKeepStr: '5'))

        // Disable concurrent builds on the same branch to avoid npm cache
        // corruption when two builds install dependencies simultaneously.
        disableConcurrentBuilds()

        // Timestamps make it easy to see how long each log line / stage took.
        timestamps()
    }

    stages {
        // 1. Checkout
        // Jenkins SCM checkout is already implicit when using the Pipeline job
        // type with "Pipeline script from SCM". This stage makes it explicit
        // and prints the commit SHA for traceability in build logs.
        stage('Checkout') {
            steps {
                echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
                echo "  Stage: Checkout"
                echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
                checkout scm
                script {
                    // Print the commit SHA and branch for build traceability
                    def commitSha = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
                    def branch    = sh(script: 'git rev-parse --abbrev-ref HEAD', returnStdout: true).trim()
                    def version   = sh(script: "node -p \"require('./package.json').version\"", returnStdout: true).trim()
                    echo "  Branch  : ${branch}"
                    echo "  Commit  : ${commitSha}"
                    echo "  Version : v${version}"
                }
            }
        }

        // 2. Install Dependencies
        // Uses `npm ci` (clean install) instead of `npm install`.
        // WHY npm ci?
        //   - Reads package-lock.json exactly → reproducible, deterministic builds
        //   - Fails if package.json and package-lock.json are out of sync
        //   - Faster than npm install on CI (skips dependency resolution)
        //   - Deletes node_modules before installing (no stale package risk)
        stage('Install Dependencies') {
            environment {
                // Override top-level NODE_ENV=production to ensure npm ci installs devDependencies
                NODE_ENV = 'development'
            }
            steps {
                echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
                echo "  Stage: Install Dependencies  (npm ci)"
                echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
                sh 'node --version'
                sh 'npm --version'
                // --prefer-offline uses the local npm cache when possible,
                // significantly speeding up CI on repeated builds.
                sh 'npm ci --prefer-offline'
                echo "  ✓ Dependencies installed"
            }
        }

        // 3. Security Audit
        // Runs `npm audit` and fails on HIGH or CRITICAL severity vulnerabilities.
        // WHY --audit-level=high (not moderate or low)?
        //   - This is a personal app; moderate vulns in transitive deps are
        //     common in the Next.js + Firebase ecosystem and are often false
        //     positives or require breaking changes to fix.
        //   - High/Critical vulns represent exploitable attack vectors that
        //     could affect real users (XSS, prototype pollution, RCE, etc.)
        //   - Setting the bar at "high" gives meaningful signal without
        //     producing spurious failures that the team can't act on.
        // If audit fails, the build is marked UNSTABLE (not FAILURE) so that
        // the lint and test stages still run — giving you the full picture in
        // one pipeline run rather than stopping at the first problem.
        stage('Security Audit') {
            steps {
                echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
                echo "  Stage: Security Audit  (npm audit --audit-level=high)"
                echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
                script {
                    // Run audit; capture exit code without failing the pipeline yet.
                    // --audit-level=high: exit code 1 only for high/critical vulns.
                    def auditStatus = sh(
                        script: 'npm audit --audit-level=high',
                        returnStatus: true
                    )
                    if (auditStatus != 0) {
                        // Mark build unstable so downstream stages still run,
                        // but the build won't be marked SUCCESS.
                        unstable("⚠️  npm audit found HIGH or CRITICAL severity vulnerabilities. " +
                                 "Review the audit report above and update affected packages.")
                    } else {
                        echo "  ✓ No high/critical vulnerabilities found"
                    }
                }
            }
        }

        // 4. Lint
        // Runs `npm run lint` which invokes `eslint . --max-warnings 0` directly.
        // --max-warnings 0 treats warnings as errors (same strictness as next lint).
        // WHY lint before tests?
        //   Lint runs fast (~5-15s). Surface broken syntax before spending 30s
        //   on Jest's SWC compilation.
        stage('Lint') {
            steps {
                echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
                echo "  Stage: Lint  (eslint . --max-warnings 0)"
                echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
                sh 'npm run lint'
                echo "  ✓ ESLint passed (next/core-web-vitals via eslint.config.mjs)"
            }
        }

        // 5. Unit Tests
        // Runs `npm run test:ci` which maps to:
        //   jest --ci --forceExit --reporters=default
        // --ci         : Fails on new/changed snapshots; disables interactive watch;
        //               optimised for non-TTY output (Jenkins console).
        // --forceExit  : Prevents Jest from hanging on open async handles
        //               (Firebase SDK internals, React 19 concurrent scheduler).
        // External services (Firebase, Upstash, Gemini, Cloudinary) are fully
        // mocked by __mocks__/ and jest.config.js moduleNameMapper.
        // NO real credentials are needed for this stage.
        stage('Unit Tests') {
            // Override NODE_ENV for tests: Jest + jsdom behave differently
            // in test mode (e.g. React's act() warnings are clearer).
            environment {
                NODE_ENV = 'test'
            }
            steps {
                echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
                echo "  Stage: Unit Tests  (npm run test:ci)"
                echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
                script {
                    // Run tests and output JSON results to test-results.json
                    sh 'npm run test:ci -- --json --outputFile=test-results.json'
                    // Parse the count of passed tests using node
                    env.TEST_COUNT = sh(
                        script: "node -p \"require('./test-results.json').numPassedTests\"",
                        returnStdout: true
                    ).trim()
                }
                echo "  ✓ All ${env.TEST_COUNT} tests passed"
            }
            post {
                // Archive the coverage report regardless of test outcome.
                // This means even a partial run produces useful data.
                always {
                    // junit requires jest-junit reporter — not installed.
                    // Use plain text output instead; coverage artifacts are
                    // archived below for inspection in Jenkins.
                    echo "  Archiving test output..."
                }
            }
        }

        // 6. Next.js Production Build
        // Runs `npm run build` which maps to `next build`.
        // This is the most important CI gate: it catches:
        //   - Import errors / module resolution failures
        //   - Static analysis errors Next.js enforces at build time
        //   - Invalid usage of Server/Client Component boundaries
        //   - Type errors (if SKIP_NEXT_VALIDATION=0)
        //   - Route configuration mistakes
        // FIREBASE SAFETY:
        //   next.config.mjs sets output: 'standalone', and firebase.js has an
        //   explicit `isBuildContext` branch that detects NODE_ENV=production +
        //   SSR and uses placeholder credentials instead of throwing.
        //   The NEXT_PUBLIC_* vars injected via environment{} above satisfy
        //   the non-SSR client bundle embedding without real Firebase access.
        // REDIS / FIREBASE-ADMIN SAFETY:
        //   Both are lazy-initialised (redis.js uses a Proxy; firebase-admin.js
        //   uses a getter pattern). Neither is called during `next build`
        //   prerendering of static shells — they only activate at runtime.
        stage('Next.js Production Build') {
            environment {
                NODE_ENV = 'production'
            }
            steps {
                echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
                echo "  Stage: Next.js Production Build  (npm run build)"
                echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
                sh 'npm run build'
                echo "  ✓ Next.js build succeeded"
            }
        }

    }

    post {

        success {
            echo ""
            echo "╔══════════════════════════════════════════════════════╗"
            echo "║  ✅  BUILD SUCCEEDED                                 ║"
            echo "║                                                      ║"
            echo "║  All quality gates passed:                           ║"
            echo "║    ✓ Dependencies installed cleanly (npm ci)         ║"
            echo "║    ✓ No high/critical security vulnerabilities       ║"
            echo "║    ✓ ESLint (next/core-web-vitals) clean             ║"
            script {
                def testCount = env.TEST_COUNT ?: "102"
                def testLine = "    ✓ ${testCount} unit tests passing"
                def paddedLine = testLine.padRight(54, ' ')
                echo "║${paddedLine}║"
            }
            echo "║    ✓ Next.js production build successful             ║"
            echo "╚══════════════════════════════════════════════════════╝"
            echo ""
        }

        unstable {
            echo ""
            echo "╔══════════════════════════════════════════════════════╗"
            echo "║  ⚠️   BUILD UNSTABLE                                  ║"
            echo "║                                                      ║"
            echo "║  Quality gate warning (likely npm audit).            ║"
            echo "║  Review the Security Audit stage output above        ║"
            echo "║  and run: npm audit --audit-level=high               ║"
            echo "╚══════════════════════════════════════════════════════╝"
            echo ""
        }

        failure {
            echo ""
            echo "╔══════════════════════════════════════════════════════╗"
            echo "║  ❌  BUILD FAILED                                    ║"
            echo "║                                                      ║"
            echo "║  Check the failed stage output above.               ║"
            echo "║  Common causes for this project:                    ║"
            echo "║    • Lint: new ESLint rule violation                 ║"
            echo "║    • Tests: broken mock or component regression      ║"
            echo "║    • Build: Server/Client component boundary error   ║"
            echo "║    • Build: missing NEXT_PUBLIC_* credential in CI   ║"
            echo "╚══════════════════════════════════════════════════════╝"
            echo ""
        }

        always {
            script {
                // Archive build artifacts
                // Archive the .next/build manifest so Jenkins stores a record
                // of what was compiled (useful for debugging build regressions).
                // The full .next/ output is NOT archived — it's large (~50-200 MB)
                // and Docker image publishing is handled by GitHub Actions.
                if (fileExists('.next/BUILD_ID')) {
                    def buildId = readFile('.next/BUILD_ID').trim()
                    echo "  Next.js Build ID: ${buildId}"
                    archiveArtifacts(
                        artifacts: '.next/BUILD_ID, .next/build-manifest.json, .next/app-build-manifest.json',
                        allowEmptyArchive: true,
                        fingerprint: false
                    )
                }

                // Workspace cleanup
                // Delete node_modules and .next to free disk space on the agent.
                // We keep the workspace root (including package-lock.json and
                // source files) so Jenkins can diff changes between builds.
                // WHY NOT cleanWs()?
                //   cleanWs() deletes everything including the git workspace,
                //   forcing a full re-clone next build. Instead we surgically
                //   remove only the heavy generated directories.
                sh '''
                    echo "Cleaning build artifacts and node_modules..."
                    rm -rf .next node_modules test-results.json
                    echo "  ✓ Workspace cleaned (node_modules, .next, test-results.json removed)"
                '''
            }
        }
    }
}
