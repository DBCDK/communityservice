#!groovy​

properties([
        buildDiscarder(logRotator(artifactDaysToKeepStr: '', artifactNumToKeepStr: '', daysToKeepStr: '', numToKeepStr: '10')),
        pipelineTriggers([])
])

def PRODUCT = "serviceprovider"
def CONTAINER_NAME = "${PRODUCT}-${BRANCH_NAME.toLowerCase()}"
def BUILD_NAME = "${PRODUCT} :: ${BRANCH_NAME.toLowerCase()}"
def DOCKER_REPO = "docker-ux.dbc.dk"
def DOCKER_NAME = "${DOCKER_REPO}/${CONTAINER_NAME}:${BUILD_NUMBER}"
def DOCKER_NAME_LATEST = "${DOCKER_REPO}/${CONTAINER_NAME}:latest"
def DOCKER_STATUS = ''
pipeline {
    agent {
        label 'devel9-head'
    }
    environment{
        NPM_TOKEN="f0d2397e-64bb-4f54-949c-feab0ee8d88f"
    }
    stages {
        stage('master2stable-build') {
            agent {
                docker {
                    image "docker.dbc.dk/dbc-node"
                    label 'devel9'
                    args '-u 0:0'
                }
            }
                steps {


                        sh "ls -la"
                        dir('src') {
                           sh """

npm up
npm install

ls -la 
ls -la environment/

. ./setup-node-env.sh

cp environments/developer.env current.env
npm run test
rm current.env
ls -la
                    """
                        }

                }

        }
        /*
        stage('Push to Artifactory') {
            when {
                branch "master"
            }
            steps {
                script {
                    if (currentBuild.resultIsBetterOrEqualTo('SUCCESS')) {
                        def ARTY_SERVER = Artifactory.server 'arty'
                        def ARTY_DOCKER = Artifactory.docker server: ARTY_SERVER, host: env.DOCKER_HOST
                        def BUILD_INFO = Artifactory.newBuildInfo()
                        BUILD_INFO.name = BUILD_NAME
                        BUILD_INFO.env.capture = true
                        BUILD_INFO.env.collect()
                        BUILD_INFO = ARTY_DOCKER.push("$DOCKER_NAME", 'docker-ux', BUILD_INFO)
                        ARTY_DOCKER.push("$DOCKER_NAME_LATEST", 'docker-ux', BUILD_INFO)
                        ARTY_SERVER.publishBuildInfo BUILD_INFO
                    }
                }
            }
        }
        */
    }
    post {
        always {
            sh "echo HUND"
           // cleanWs()
            /*
            script {
                sh """
                    docker rmi $DOCKER_NAME
                """
            }

             */
        }
    }
}
