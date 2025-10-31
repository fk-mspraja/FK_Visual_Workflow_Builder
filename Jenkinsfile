#!/usr/bin/env groovy

/**
 * FourKites Workflow Builder - Jenkins CI/CD Pipeline
 *
 * This pipeline supports deployment to both AWS and Azure
 * Configure deployment target via Jenkins parameters
 */

pipeline {
    agent any

    // Build parameters
    parameters {
        choice(
            name: 'DEPLOYMENT_TARGET',
            choices: ['AWS', 'AZURE'],
            description: 'Select deployment platform'
        )
        choice(
            name: 'ENVIRONMENT',
            choices: ['dev', 'staging', 'production'],
            description: 'Target environment'
        )
        string(
            name: 'DOCKER_REGISTRY',
            defaultValue: '',
            description: 'Docker registry URL (leave empty for default)'
        )
    }

    environment {
        // Application
        APP_NAME = 'fourkites-workflow-builder'

        // Docker images
        BACKEND_IMAGE = "${APP_NAME}-backend"
        FRONTEND_IMAGE = "${APP_NAME}-frontend"
        TEMPORAL_WORKER_IMAGE = "${APP_NAME}-temporal-worker"

        // Ports
        BACKEND_PORT = '8001'
        FRONTEND_PORT = '3000'
        TEMPORAL_UI_PORT = '8233'
        TEMPORAL_SERVER_PORT = '7233'
        REDIS_PORT = '6379'

        // AWS specific
        AWS_REGION = credentials('aws-region')
        AWS_ECR_REGISTRY = credentials('aws-ecr-registry')
        AWS_ECS_CLUSTER = "${APP_NAME}-${params.ENVIRONMENT}"

        // Azure specific
        AZURE_REGISTRY = credentials('azure-container-registry')
        AZURE_AKS_CLUSTER = "${APP_NAME}-${params.ENVIRONMENT}"
        AZURE_RESOURCE_GROUP = "${APP_NAME}-rg"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
                script {
                    env.GIT_COMMIT_SHORT = sh(
                        script: "git rev-parse --short HEAD",
                        returnStdout: true
                    ).trim()
                    env.BUILD_TAG = "${env.GIT_COMMIT_SHORT}-${env.BUILD_NUMBER}"
                }
            }
        }

        stage('Install Dependencies') {
            parallel {
                stage('Backend Dependencies') {
                    steps {
                        dir('backend') {
                            sh '''
                                python3 -m venv venv
                                . venv/bin/activate
                                pip install --upgrade pip
                                pip install -r requirements.txt
                            '''
                        }
                    }
                }
                stage('Frontend Dependencies') {
                    steps {
                        dir('frontend') {
                            sh 'npm ci'
                        }
                    }
                }
                stage('Temporal Dependencies') {
                    steps {
                        dir('temporal') {
                            sh '''
                                python3 -m venv venv
                                . venv/bin/activate
                                pip install --upgrade pip
                                pip install -r requirements.txt
                            '''
                        }
                    }
                }
            }
        }

        stage('Run Tests') {
            parallel {
                stage('Backend Tests') {
                    steps {
                        dir('backend') {
                            sh '''
                                . venv/bin/activate
                                pytest tests/ -v --cov=app --cov-report=xml
                            '''
                        }
                    }
                }
                stage('Frontend Tests') {
                    steps {
                        dir('frontend') {
                            sh 'npm test -- --watchAll=false'
                        }
                    }
                }
            }
        }

        stage('Build Docker Images') {
            parallel {
                stage('Build Backend') {
                    steps {
                        script {
                            sh """
                                docker build -t ${BACKEND_IMAGE}:${BUILD_TAG} \
                                    -f infrastructure/docker/backend.Dockerfile .
                                docker tag ${BACKEND_IMAGE}:${BUILD_TAG} ${BACKEND_IMAGE}:latest
                            """
                        }
                    }
                }
                stage('Build Frontend') {
                    steps {
                        script {
                            sh """
                                docker build -t ${FRONTEND_IMAGE}:${BUILD_TAG} \
                                    -f infrastructure/docker/frontend.Dockerfile .
                                docker tag ${FRONTEND_IMAGE}:${BUILD_TAG} ${FRONTEND_IMAGE}:latest
                            """
                        }
                    }
                }
                stage('Build Temporal Worker') {
                    steps {
                        script {
                            sh """
                                docker build -t ${TEMPORAL_WORKER_IMAGE}:${BUILD_TAG} \
                                    -f infrastructure/docker/temporal.Dockerfile .
                                docker tag ${TEMPORAL_WORKER_IMAGE}:${BUILD_TAG} ${TEMPORAL_WORKER_IMAGE}:latest
                            """
                        }
                    }
                }
            }
        }

        stage('Push to Registry') {
            steps {
                script {
                    if (params.DEPLOYMENT_TARGET == 'AWS') {
                        // Push to AWS ECR
                        sh '''
                            aws ecr get-login-password --region ${AWS_REGION} | \
                                docker login --username AWS --password-stdin ${AWS_ECR_REGISTRY}

                            docker tag ${BACKEND_IMAGE}:${BUILD_TAG} ${AWS_ECR_REGISTRY}/${BACKEND_IMAGE}:${BUILD_TAG}
                            docker tag ${FRONTEND_IMAGE}:${BUILD_TAG} ${AWS_ECR_REGISTRY}/${FRONTEND_IMAGE}:${BUILD_TAG}
                            docker tag ${TEMPORAL_WORKER_IMAGE}:${BUILD_TAG} ${AWS_ECR_REGISTRY}/${TEMPORAL_WORKER_IMAGE}:${BUILD_TAG}

                            docker push ${AWS_ECR_REGISTRY}/${BACKEND_IMAGE}:${BUILD_TAG}
                            docker push ${AWS_ECR_REGISTRY}/${FRONTEND_IMAGE}:${BUILD_TAG}
                            docker push ${AWS_ECR_REGISTRY}/${TEMPORAL_WORKER_IMAGE}:${BUILD_TAG}
                        '''
                    } else if (params.DEPLOYMENT_TARGET == 'AZURE') {
                        // Push to Azure ACR
                        withCredentials([usernamePassword(credentialsId: 'azure-credentials',
                                                          usernameVariable: 'AZURE_CLIENT_ID',
                                                          passwordVariable: 'AZURE_CLIENT_SECRET')]) {
                            sh '''
                                az login --service-principal -u ${AZURE_CLIENT_ID} -p ${AZURE_CLIENT_SECRET} --tenant ${AZURE_TENANT_ID}
                                az acr login --name ${AZURE_REGISTRY}

                                docker tag ${BACKEND_IMAGE}:${BUILD_TAG} ${AZURE_REGISTRY}.azurecr.io/${BACKEND_IMAGE}:${BUILD_TAG}
                                docker tag ${FRONTEND_IMAGE}:${BUILD_TAG} ${AZURE_REGISTRY}.azurecr.io/${FRONTEND_IMAGE}:${BUILD_TAG}
                                docker tag ${TEMPORAL_WORKER_IMAGE}:${BUILD_TAG} ${AZURE_REGISTRY}.azurecr.io/${TEMPORAL_WORKER_IMAGE}:${BUILD_TAG}

                                docker push ${AZURE_REGISTRY}.azurecr.io/${BACKEND_IMAGE}:${BUILD_TAG}
                                docker push ${AZURE_REGISTRY}.azurecr.io/${FRONTEND_IMAGE}:${BUILD_TAG}
                                docker push ${AZURE_REGISTRY}.azurecr.io/${TEMPORAL_WORKER_IMAGE}:${BUILD_TAG}
                            '''
                        }
                    }
                }
            }
        }

        stage('Deploy') {
            steps {
                script {
                    if (params.DEPLOYMENT_TARGET == 'AWS') {
                        // Deploy to AWS ECS
                        sh '''
                            # Update ECS task definitions
                            aws ecs update-service \
                                --cluster ${AWS_ECS_CLUSTER} \
                                --service ${APP_NAME}-backend \
                                --force-new-deployment \
                                --region ${AWS_REGION}

                            aws ecs update-service \
                                --cluster ${AWS_ECS_CLUSTER} \
                                --service ${APP_NAME}-frontend \
                                --force-new-deployment \
                                --region ${AWS_REGION}

                            aws ecs update-service \
                                --cluster ${AWS_ECS_CLUSTER} \
                                --service ${APP_NAME}-temporal-worker \
                                --force-new-deployment \
                                --region ${AWS_REGION}
                        '''
                    } else if (params.DEPLOYMENT_TARGET == 'AZURE') {
                        // Deploy to Azure AKS
                        withCredentials([usernamePassword(credentialsId: 'azure-credentials',
                                                          usernameVariable: 'AZURE_CLIENT_ID',
                                                          passwordVariable: 'AZURE_CLIENT_SECRET')]) {
                            sh '''
                                az login --service-principal -u ${AZURE_CLIENT_ID} -p ${AZURE_CLIENT_SECRET} --tenant ${AZURE_TENANT_ID}
                                az aks get-credentials --resource-group ${AZURE_RESOURCE_GROUP} --name ${AZURE_AKS_CLUSTER}

                                # Update Kubernetes deployments
                                kubectl set image deployment/backend backend=${AZURE_REGISTRY}.azurecr.io/${BACKEND_IMAGE}:${BUILD_TAG}
                                kubectl set image deployment/frontend frontend=${AZURE_REGISTRY}.azurecr.io/${FRONTEND_IMAGE}:${BUILD_TAG}
                                kubectl set image deployment/temporal-worker temporal-worker=${AZURE_REGISTRY}.azurecr.io/${TEMPORAL_WORKER_IMAGE}:${BUILD_TAG}

                                # Wait for rollout
                                kubectl rollout status deployment/backend
                                kubectl rollout status deployment/frontend
                                kubectl rollout status deployment/temporal-worker
                            '''
                        }
                    }
                }
            }
        }

        stage('Health Check') {
            steps {
                script {
                    echo "Waiting for services to be healthy..."
                    sleep(time: 30, unit: 'SECONDS')

                    // Add health check logic here
                    sh '''
                        # Example health check
                        # curl -f http://your-backend-url/health || exit 1
                        echo "Health check completed"
                    '''
                }
            }
        }
    }

    post {
        success {
            echo "Deployment to ${params.DEPLOYMENT_TARGET} ${params.ENVIRONMENT} completed successfully!"
            // Add Slack/Teams notification here
        }
        failure {
            echo "Deployment failed. Please check the logs."
            // Add Slack/Teams notification here
        }
        always {
            // Clean up
            sh '''
                docker system prune -f
            '''
        }
    }
}
