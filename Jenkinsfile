pipeline {
  agent any

  environment {
    REGISTRY = 'mandalakodanda'
    IMAGE_TAG = "${env.BUILD_NUMBER}"
    KUBE_NAMESPACE = 'forestroots'
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Install and Test Services') {
      parallel {
        stage('API Gateway') {
          steps {
            dir('services/api-gateway') {
              sh 'npm install'
              sh 'npm test'
            }
          }
        }
        stage('User Service') {
          steps {
            dir('services/user-service') {
              sh 'npm install'
              sh 'npm test'
            }
          }
        }
        stage('Product Service') {
          steps {
            dir('services/product-service') {
              sh 'npm install'
              sh 'npm test'
            }
          }
        }
        stage('Order Service') {
          steps {
            dir('services/order-service') {
              sh 'npm install'
              sh 'npm test'
            }
          }
        }
        stage('Notification Service') {
          steps {
            dir('services/notification-service') {
              sh 'npm install'
              sh 'npm test'
            }
          }
        }
        stage('Frontend') {
          steps {
            dir('frontend') {
              sh 'npm install'
              sh 'npm run build'
            }
          }
        }
      }
    }

    stage('Build Images') {
      steps {
        sh 'docker build -t $REGISTRY/forestroots-api-gateway:$IMAGE_TAG services/api-gateway'
        sh 'docker build -t $REGISTRY/forestroots-user-service:$IMAGE_TAG services/user-service'
        sh 'docker build -t $REGISTRY/forestroots-product-service:$IMAGE_TAG services/product-service'
        sh 'docker build -t $REGISTRY/forestroots-order-service:$IMAGE_TAG services/order-service'
        sh 'docker build -t $REGISTRY/forestroots-notification-service:$IMAGE_TAG services/notification-service'
        sh 'docker build --build-arg VITE_API_URL=https://api.forestroots.example.com/api -t $REGISTRY/forestroots-frontend:$IMAGE_TAG frontend'
      }
    }

    stage('Push Images') {
      steps {
        withCredentials([usernamePassword(credentialsId: 'dockerhub-creds', usernameVariable: 'REGISTRY_USER', passwordVariable: 'REGISTRY_PASSWORD')]) {
          sh 'echo $REGISTRY_PASSWORD | docker login -u $REGISTRY_USER --password-stdin'
          sh 'docker push $REGISTRY/forestroots-api-gateway:$IMAGE_TAG'
          sh 'docker push $REGISTRY/forestroots-user-service:$IMAGE_TAG'
          sh 'docker push $REGISTRY/forestroots-product-service:$IMAGE_TAG'
          sh 'docker push $REGISTRY/forestroots-order-service:$IMAGE_TAG'
          sh 'docker push $REGISTRY/forestroots-notification-service:$IMAGE_TAG'
          sh 'docker push $REGISTRY/forestroots-frontend:$IMAGE_TAG'
        }
      }
    }

    stage('Deploy to Kubernetes') {
      steps {
        
          sh 'kubectl apply -f k8s/namespace.yaml'
          sh 'kubectl apply -f k8s/configmap.yaml -f k8s/secrets.yaml -f k8s/postgres.yaml'
          sh 'kubectl apply -f k8s/deployments.yaml -f k8s/services.yaml -f k8s/ingress.yaml'
          sh 'kubectl -n $KUBE_NAMESPACE set image deployment/api-gateway api-gateway=$REGISTRY/forestroots-api-gateway:$IMAGE_TAG'
          sh 'kubectl -n $KUBE_NAMESPACE set image deployment/user-service user-service=$REGISTRY/forestroots-user-service:$IMAGE_TAG'
          sh 'kubectl -n $KUBE_NAMESPACE set image deployment/product-service product-service=$REGISTRY/forestroots-product-service:$IMAGE_TAG'
          sh 'kubectl -n $KUBE_NAMESPACE set image deployment/order-service order-service=$REGISTRY/forestroots-order-service:$IMAGE_TAG'
          sh 'kubectl -n $KUBE_NAMESPACE set image deployment/notification-service notification-service=$REGISTRY/forestroots-notification-service:$IMAGE_TAG'
          sh 'kubectl -n $KUBE_NAMESPACE set image deployment/forestroots-frontend forestroots-frontend=$REGISTRY/forestroots-frontend:$IMAGE_TAG'
          
          sh 'kubectl -n $KUBE_NAMESPACE rollout status deployment/api-gateway'
        }
      }
    }
  }


